/**
 * Verifies a Google Play Billing purchase and writes the entitlement.
 *
 * The client sends only the purchase token; the authoritative state comes from
 * the Play Developer API. Purchases are acknowledged so Google does not
 * auto-refund them after three days.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  acknowledgeGooglePurchase,
  getGooglePurchaseState,
  googleStateToLedger,
  GoogleConfigError,
} from "../_shared/playstore.ts";
import {
  planFromGoogleProduct,
  requireUser,
  serviceClient,
  titleCasePlan,
  upsertEntitlement,
  type Status,
} from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[VERIFY-GOOGLE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const BodySchema = z.object({
  purchaseToken: z.string().min(10).max(4096),
  productId: z.string().min(1).max(128).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = serviceClient();

  try {
    const user = await requireUser(req, admin);

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }

    const state = await getGooglePurchaseState(parsed.data.purchaseToken);
    if (!state) {
      log("Purchase token unknown to Google");
      return json({ subscribed: false, plan: "free", reason: "not_found" }, 200);
    }

    const plan = planFromGoogleProduct(state.productId ?? parsed.data.productId, state.basePlanId);
    if (plan === "free") {
      return json({ error: `Unrecognized product: ${state.productId ?? "unknown"}` }, 400);
    }

    const status = googleStateToLedger(state.state, state.autoRenew) as Status;

    const result = await upsertEntitlement(admin, {
      user_id: user.id,
      plan,
      platform: "android",
      provider: "google",
      product_id: state.productId,
      base_plan_id: state.basePlanId,
      purchase_token: state.purchaseToken,
      subscription_status: status,
      current_period_end: state.expiryTime,
      auto_renew: state.autoRenew,
      is_trial: state.isTrial,
      raw_payload: { subscriptionState: state.state },
    });

    if (result.conflict) {
      log("Purchase token already bound to another account");
      return json(
        {
          error:
            "This Google Play subscription is already linked to a different PixelSqueeze account. Sign in with that account or contact support.",
        },
        409,
      );
    }

    if (!state.acknowledged && state.productId) {
      await acknowledgeGooglePurchase(state.productId, state.purchaseToken);
      log("Purchase acknowledged");
    }

    log("Entitlement stored", { plan, status });
    return json({
      subscribed: ["active", "trialing", "grace_period"].includes(status),
      plan,
      subscription_tier: titleCasePlan(plan),
      status,
      provider: "google",
      platform: "android",
      current_period_end: state.expiryTime,
      is_trial: state.isTrial,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return json({ error: message }, error instanceof GoogleConfigError ? 503 : 500);
  }
});
