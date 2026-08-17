/**
 * Unified entitlement resolver.
 *
 * Resolution model (no provider "wins" by being checked first):
 *   1. Complimentary (free-forever) access — granted server-side only — always wins.
 *   2. Refresh Stripe state into the `subscriptions` ledger.
 *   3. Pick the HIGHEST still-valid entitlement across every provider
 *      (Stripe + Apple + Google), so a low native plan can never shadow a
 *      higher Stripe plan and vice versa.
 *
 * "Still valid" means status + current_period_end — never auto-renew. A
 * subscription that was canceled but is paid through a future date keeps full
 * access until that date.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import {
  isEntitled,
  pickBest,
  planFromStripe,
  serviceClient,
  requireUser,
  syncSubscribersCache,
  titleCasePlan,
  type Plan,
  type Status,
} from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const FREE_RESPONSE = {
  subscribed: false,
  is_trialing: false,
  trial_end: null,
  product_id: null,
  subscription_end: null,
  subscription_tier: null,
  plan: "free",
  provider: null,
  platform: "web",
  manageable_here: false,
  complimentary: false,
  auto_renew: false,
  cancel_at_period_end: false,
  status: null,
};

/** Refresh the caller's Stripe subscription into the ledger. */
async function refreshStripe(admin: any, userId: string, email: string) {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    logStep("STRIPE_SECRET_KEY not set — skipping Stripe refresh");
    return;
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) {
    await expireStripeRows(admin, userId);
    return;
  }

  const customerId = customers.data[0].id;
  const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 10 });

  // Any Stripe subscription that is active or trialing counts, including ones
  // flagged cancel_at_period_end (still paid through the period).
  const live = subscriptions.data.filter(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  if (live.length === 0) {
    await expireStripeRows(admin, userId);
    return;
  }

  for (const active of live) {
    const item = active.items.data[0];
    const priceId = item?.price?.id ?? null;
    const productId =
      typeof item?.price?.product === "string"
        ? item.price.product
        : (item?.price?.product as any)?.id ?? null;
    const plan = planFromStripe(priceId ?? productId);
    const isTrialing = active.status === "trialing";
    const periodEnd = (active as unknown as { current_period_end?: number }).current_period_end;
    const subscriptionEnd =
      periodEnd && periodEnd > 0 ? new Date(periodEnd * 1000).toISOString() : null;
    const cancelAtPeriodEnd = Boolean(active.cancel_at_period_end);

    const record = {
      user_id: userId,
      plan,
      platform: "web" as const,
      provider: "stripe" as const,
      product_id: productId,
      stripe_subscription_id: active.id,
      stripe_customer_id: customerId,
      // cancel_at_period_end is recorded as `canceled` + auto_renew false, which
      // still grants access until current_period_end.
      subscription_status: (isTrialing
        ? "trialing"
        : cancelAtPeriodEnd
          ? "canceled"
          : "active") as Status,
      current_period_end: subscriptionEnd,
      auto_renew: !cancelAtPeriodEnd,
      is_trial: isTrialing,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", active.id)
      .maybeSingle();

    if (existing) {
      await admin.from("subscriptions").update(record).eq("id", existing.id);
    } else {
      await admin.from("subscriptions").insert(record);
    }
  }

  // Expire ledger rows for Stripe subscriptions that no longer exist upstream.
  const liveIds = new Set(live.map((s) => s.id));
  const { data: stripeRows } = await admin
    .from("subscriptions")
    .select("id,stripe_subscription_id,subscription_status")
    .eq("user_id", userId)
    .eq("provider", "stripe");

  const staleIds = (stripeRows ?? [])
    .filter(
      (row: any) =>
        !liveIds.has(row.stripe_subscription_id) &&
        ["active", "trialing", "grace_period", "canceled"].includes(row.subscription_status),
    )
    .map((row: any) => row.id);

  if (staleIds.length > 0) {
    await admin
      .from("subscriptions")
      .update({ subscription_status: "expired", updated_at: new Date().toISOString() })
      .in("id", staleIds);
  }
}

async function expireStripeRows(admin: any, userId: string) {
  await admin
    .from("subscriptions")
    .update({ subscription_status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .in("subscription_status", ["active", "trialing", "grace_period", "canceled"]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const admin = serviceClient();

  try {
    const user = await requireUser(req, admin);
    if (!user.email) throw new Error("User email not available");
    logStep("User authenticated", { userId: user.id });

    // ---- 1. Complimentary access always wins -------------------------------
    const { data: compRow } = await admin
      .from("subscribers")
      .select("complimentary_access, subscription_tier")
      .eq("user_id", user.id)
      .maybeSingle();

    if (compRow?.complimentary_access === true) {
      logStep("Complimentary access granted", { userId: user.id });
      const tier = compRow.subscription_tier ?? "Pro";
      return json({
        subscribed: true,
        is_trialing: false,
        trial_end: null,
        product_id: null,
        subscription_end: null,
        subscription_tier: tier,
        plan: tier.toLowerCase(),
        provider: "complimentary",
        platform: "web",
        manageable_here: false,
        complimentary: true,
        auto_renew: true,
        cancel_at_period_end: false,
        status: "active",
      });
    }

    // ---- 2. Refresh Stripe, then compare every provider fairly -------------
    try {
      await refreshStripe(admin, user.id, user.email);
    } catch (stripeError) {
      // A Stripe outage must not strip a valid Apple/Google entitlement.
      logStep("Stripe refresh failed — falling back to ledger", {
        message: stripeError instanceof Error ? stripeError.message : String(stripeError),
      });
    }

    const { data: ledgerRows } = await admin
      .from("subscriptions")
      .select(
        "plan,provider,platform,subscription_status,current_period_end,is_trial,product_id,auto_renew",
      )
      .eq("user_id", user.id);

    const best = pickBest(
      (ledgerRows ?? []).map((r: any) => ({
        ...r,
        plan: r.plan as Plan,
        subscription_status: r.subscription_status as Status,
      })),
    );

    await syncSubscribersCache(admin, user.id);

    if (!best) {
      logStep("No valid entitlement in any provider");
      return json(FREE_RESPONSE);
    }

    const status = best.subscription_status as Status;
    logStep("Effective entitlement resolved", {
      plan: best.plan,
      provider: best.provider,
      status,
      autoRenew: best.auto_renew,
    });

    return json({
      subscribed: isEntitled(status, best.current_period_end),
      is_trialing: Boolean(best.is_trial) || status === "trialing",
      trial_end: best.is_trial || status === "trialing" ? best.current_period_end : null,
      product_id: best.product_id ?? null,
      subscription_end: best.current_period_end ?? null,
      subscription_tier: titleCasePlan(best.plan),
      plan: best.plan,
      provider: best.provider,
      platform: best.platform,
      // Only Stripe subscriptions can be managed inside our own app; Apple and
      // Google require their own account surfaces.
      manageable_here: best.provider === "stripe",
      complimentary: false,
      auto_renew: best.auto_renew !== false,
      cancel_at_period_end: best.auto_renew === false,
      status,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});
