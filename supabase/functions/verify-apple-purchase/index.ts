/**
 * Verifies an Apple StoreKit 2 purchase and writes the entitlement.
 *
 * The client sends only an identifier (originalTransactionId, or a signed
 * transaction we decode purely to read that identifier). The real subscription
 * state always comes from Apple's App Store Server API, so a tampered client
 * cannot grant itself a plan.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import {
  appleStatusToLedger,
  decodeJwsPayload,
  getAppleSubscriptionState,
  AppleConfigError,
} from "../_shared/appstore.ts";
import {
  APPLE_BUNDLE_ID,
  planFromAppleProduct,
  isEntitled,
  requireUser,
  serviceClient,
  upsertEntitlement,
  titleCasePlan,
  type Status,
} from "../_shared/entitlements.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[VERIFY-APPLE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

const BodySchema = z.object({
  originalTransactionId: z.string().min(1).max(128).optional(),
  signedTransaction: z.string().min(20).max(20000).optional(),
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

    let originalTransactionId = parsed.data.originalTransactionId ?? null;
    if (!originalTransactionId && parsed.data.signedTransaction) {
      const claims = decodeJwsPayload<{ originalTransactionId?: string }>(
        parsed.data.signedTransaction,
      );
      originalTransactionId = claims?.originalTransactionId ?? null;
    }

    if (!originalTransactionId) {
      return json({ error: "originalTransactionId or signedTransaction is required" }, 400);
    }

    const state = await getAppleSubscriptionState(originalTransactionId);
    if (!state) {
      log("No subscription found at Apple", { originalTransactionId });
      return json({ subscribed: false, plan: "free", reason: "not_found" }, 200);
    }

    if (state.bundleId && state.bundleId !== APPLE_BUNDLE_ID) {
      log("Bundle ID mismatch", { got: state.bundleId });
      return json({ error: "Receipt does not belong to this app" }, 403);
    }

    const plan = planFromAppleProduct(state.productId);
    if (plan === "free") {
      return json({ error: `Unrecognized product: ${state.productId}` }, 400);
    }

    const status = appleStatusToLedger(state.status, state.autoRenew) as Status;
    const result = await upsertEntitlement(admin, {
      user_id: user.id,
      plan,
      platform: "ios",
      provider: "apple",
      product_id: state.productId,
      original_transaction_id: state.originalTransactionId,
      subscription_status: status,
      current_period_end: state.expiresDate ? new Date(state.expiresDate).toISOString() : null,
      auto_renew: state.autoRenew,
      is_trial: state.isTrial,
      environment: state.environment === "Sandbox" ? "sandbox" : "production",
      raw_payload: { appleStatus: state.status },
    });

    if (result.conflict) {
      log("Receipt already bound to another account");
      return json(
        {
          error:
            "This App Store subscription is already linked to a different PixelSqueeze account. Sign in with that account or contact support.",
        },
        409,
      );
    }

    log("Entitlement stored", { plan, status });
    const periodEnd = state.expiresDate ? new Date(state.expiresDate).toISOString() : null;
    return json({
      subscribed: isEntitled(status, periodEnd),
      plan,
      subscription_tier: titleCasePlan(plan),
      status,
      provider: "apple",
      platform: "ios",
      current_period_end: state.expiresDate ? new Date(state.expiresDate).toISOString() : null,
      is_trial: state.isTrial,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    // Missing credentials is a setup problem, not a client error.
    return json({ error: message }, error instanceof AppleConfigError ? 503 : 500);
  }
});
