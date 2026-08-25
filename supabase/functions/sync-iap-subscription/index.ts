/**
 * Records an App Store / Google Play subscription against the caller's account.
 *
 * TRUST MODEL (known gap, follow-up planned):
 * StoreKit and Play Billing verify their own receipts before the app ever sees a
 * transaction, but this endpoint trusts the app binary rather than a
 * cryptographic proof. The planned follow-up is server-side verification:
 *   iOS     -> App Store Server API GET /inApps/v1/transactions/{transactionId}
 *              with JWS signature validation.
 *   Android -> Play Developer API purchases.subscriptionsv2.get(packageName,
 *              purchaseToken), whose lineItems[].offerDetails.basePlanId is the
 *              authoritative Android tier (making iap_plan_assumed unnecessary).
 * See verifyWithStore() below for the hook. Not implemented here — it needs
 * credentials that are not configured yet.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[SYNC-IAP] ${step}${details !== undefined ? ` - ${JSON.stringify(details)}` : ""}`);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const PLANS = ["creator", "pro", "business"] as const;
type Plan = (typeof PLANS)[number];

const TIER_LABEL: Record<Plan, string> = {
  creator: "Creator",
  pro: "Pro",
  business: "Business",
};

/**
 * Placeholder for authoritative store-side verification (see file header).
 * Returns the trusted plan once implemented; today the client payload stands.
 */
// deno-lint-ignore no-unused-vars
async function verifyWithStore(_payload: unknown): Promise<Plan | null> {
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      log("Missing Authorization header");
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user?.id) {
      log("Invalid token", { message: userError?.message });
      return json({ error: "Unauthorized" }, 401);
    }
    log("User authenticated", { userId: user.id });

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const platform = typeof body.platform === "string" ? body.platform : "";
    const active = body.active === true;

    if (platform !== "ios" && platform !== "android") {
      log("Invalid platform", { platform });
      return json({ error: "platform must be 'ios' or 'android'" }, 400);
    }

    const plan = typeof body.plan === "string" ? (body.plan.toLowerCase() as Plan) : null;
    if (active && (!plan || !PLANS.includes(plan))) {
      log("Invalid plan for active subscription", { plan: body.plan });
      return json({ error: "plan must be one of creator, pro, business" }, 400);
    }

    // ---- a) Make sure the subscribers row exists -----------------------------
    const { data: existing } = await admin
      .from("subscribers")
      .select("id, stripe_customer_id, complimentary_access")
      .eq("user_id", user.id)
      .maybeSingle();

    let row = existing;
    if (!row) {
      log("Creating subscribers row", { userId: user.id });
      const { data: inserted, error: insertError } = await admin
        .from("subscribers")
        .insert({
          user_id: user.id,
          email: user.email ?? "",
          subscribed: false,
          free_compressions_used: 0,
        })
        .select("id, stripe_customer_id, complimentary_access")
        .single();
      if (insertError) throw new Error(`Could not create subscriber row: ${insertError.message}`);
      row = inserted;
    }

    const hasOwnStripe = Boolean(row?.stripe_customer_id);
    const hasComplimentary = row?.complimentary_access === true;

    const clearedIap = {
      iap_platform: null,
      iap_plan: null,
      iap_product_id: null,
      iap_base_plan_id: null,
      iap_plan_assumed: false,
      iap_transaction_id: null,
      iap_original_transaction_id: null,
      iap_purchase_token: null,
      iap_expires_at: null,
      iap_auto_renewing: null,
      iap_environment: null,
    };

    // ---- b) Inactive: clear store fields, never revoke foreign access -------
    if (!active) {
      const keptAccess = hasOwnStripe || hasComplimentary;
      const update: Record<string, unknown> = {
        ...clearedIap,
        iap_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!keptAccess) update.subscribed = false;

      const { error } = await admin.from("subscribers").update(update).eq("user_id", user.id);
      if (error) throw new Error(error.message);

      log("Store subscription cleared", { userId: user.id, keptAccess });
      return json({ synced: true, active: false, kept_access: keptAccess });
    }

    // ---- c) Active: release the purchase from other accounts, then record ---
    const originalTransactionId =
      typeof body.originalTransactionId === "string" ? body.originalTransactionId : null;
    const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken : null;

    for (const [column, value] of [
      ["iap_original_transaction_id", originalTransactionId],
      ["iap_purchase_token", purchaseToken],
    ] as const) {
      if (!value) continue;
      const { data: released, error: releaseError } = await admin
        .from("subscribers")
        .update({ ...clearedIap, subscribed: false, updated_at: new Date().toISOString() })
        .eq(column, value)
        .neq("user_id", user.id)
        .is("stripe_customer_id", null)
        .eq("complimentary_access", false)
        .select("user_id");
      if (releaseError) {
        log("Release from other accounts failed", { column, message: releaseError.message });
      } else if (released && released.length > 0) {
        log("Released purchase from other accounts", { column, count: released.length });
      }
    }

    const expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : null;
    const update = {
      subscribed: true,
      subscription_tier: TIER_LABEL[plan as Plan],
      subscription_end: expiresAt,
      iap_platform: platform,
      iap_plan: plan,
      iap_product_id: typeof body.productId === "string" ? body.productId : null,
      iap_base_plan_id: typeof body.basePlanId === "string" ? body.basePlanId : null,
      iap_plan_assumed: body.planAssumed === true,
      iap_transaction_id: typeof body.transactionId === "string" ? body.transactionId : null,
      iap_original_transaction_id: originalTransactionId,
      iap_purchase_token: purchaseToken,
      iap_expires_at: expiresAt,
      iap_auto_renewing: typeof body.isAutoRenewing === "boolean" ? body.isAutoRenewing : null,
      iap_environment: typeof body.environment === "string" ? body.environment : null,
      iap_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await admin
      .from("subscribers")
      .update(update)
      .eq("user_id", user.id);
    if (updateError) throw new Error(updateError.message);

    log("Store subscription recorded", {
      userId: user.id,
      platform,
      plan,
      expiresAt,
      planAssumed: update.iap_plan_assumed,
    });

    return json({
      synced: true,
      active: true,
      plan,
      subscription_tier: TIER_LABEL[plan as Plan],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return json({ error: message }, 500);
  }
});
