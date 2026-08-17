/**
 * Unified entitlement resolver.
 *
 * Priority order:
 *   1. Complimentary (free-forever) access — granted server-side only.
 *   2. Native store subscriptions (Apple / Google) from the `subscriptions` ledger.
 *   3. Stripe web subscriptions (also mirrored into the ledger while we're here).
 *
 * The response keeps every legacy field the app already reads and adds the
 * normalized `plan` / `provider` / `platform` fields.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import {
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
      });
    }

    // ---- 2. Native store entitlements from the ledger ----------------------
    const { data: ledgerRows } = await admin
      .from("subscriptions")
      .select(
        "plan,provider,platform,subscription_status,current_period_end,is_trial,product_id,auto_renew",
      )
      .eq("user_id", user.id);

    const nativeBest = pickBest(
      (ledgerRows ?? [])
        .filter((r) => r.provider === "apple" || r.provider === "google")
        .map((r) => ({
          ...r,
          plan: r.plan as Plan,
          subscription_status: r.subscription_status as Status,
        })),
    );

    if (nativeBest) {
      logStep("Native entitlement found", {
        provider: nativeBest.provider,
        plan: nativeBest.plan,
      });
      return json({
        subscribed: true,
        is_trialing: Boolean(nativeBest.is_trial),
        trial_end: nativeBest.is_trial ? nativeBest.current_period_end : null,
        product_id: nativeBest.product_id,
        subscription_end: nativeBest.current_period_end,
        subscription_tier: titleCasePlan(nativeBest.plan),
        plan: nativeBest.plan,
        provider: nativeBest.provider,
        platform: nativeBest.platform,
        // Cancellation must happen in the store the purchase was made in.
        manageable_here: false,
        complimentary: false,
      });
    }

    // ---- 3. Stripe (web) ---------------------------------------------------
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return json({
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
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const active = subscriptions.data.find(
      (sub) => sub.status === "active" || sub.status === "trialing",
    );

    if (!active) {
      logStep("No active Stripe subscription");
      // Expire any stale Stripe ledger rows for this user.
      await admin
        .from("subscriptions")
        .update({ subscription_status: "expired", updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("provider", "stripe")
        .in("subscription_status", ["active", "trialing", "grace_period"]);
      await syncSubscribersCache(admin, user.id);

      return json({
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
      });
    }

    const item = active.items.data[0];
    const priceId = item?.price?.id ?? null;
    const productId =
      typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id ?? null;
    const plan = planFromStripe(priceId ?? productId);
    const isTrialing = active.status === "trialing";
    const periodEnd = (active as unknown as { current_period_end?: number }).current_period_end;
    const subscriptionEnd =
      periodEnd && periodEnd > 0 ? new Date(periodEnd * 1000).toISOString() : null;
    const trialEnd = isTrialing && active.trial_end
      ? new Date(active.trial_end * 1000).toISOString()
      : null;

    // Mirror into the ledger so the entitlement source of truth stays complete.
    const record = {
      user_id: user.id,
      plan,
      platform: "web" as const,
      provider: "stripe" as const,
      product_id: productId,
      stripe_subscription_id: active.id,
      stripe_customer_id: customerId,
      subscription_status: (isTrialing ? "trialing" : "active") as Status,
      current_period_end: subscriptionEnd,
      auto_renew: !active.cancel_at_period_end,
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
    await syncSubscribersCache(admin, user.id);

    logStep("Stripe entitlement resolved", { plan, isTrialing });

    return json({
      subscribed: true,
      is_trialing: isTrialing,
      trial_end: trialEnd,
      product_id: productId,
      subscription_end: subscriptionEnd,
      subscription_tier: titleCasePlan(plan),
      plan,
      provider: "stripe",
      platform: "web",
      manageable_here: true,
      complimentary: false,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});
