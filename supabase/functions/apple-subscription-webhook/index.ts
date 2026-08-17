/**
 * App Store Server Notifications V2 endpoint.
 *
 * Apple posts an unauthenticated signed payload here. Rather than verifying the
 * JWS x5c chain ourselves, we decode the payload only to read the
 * originalTransactionId, then re-fetch the authoritative state from Apple's
 * App Store Server API over an authenticated TLS call. A forged notification
 * therefore cannot grant or revoke anything — it can only trigger a lookup.
 *
 * Configure this URL in App Store Connect > App Information > App Store Server
 * Notifications (Version 2).
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  appleStatusToLedger,
  decodeJwsPayload,
  getAppleSubscriptionState,
} from "../_shared/appstore.ts";
import {
  planFromAppleProduct,
  serviceClient,
  syncSubscribersCache,
  type Status,
} from "../_shared/entitlements.ts";

const log = (step: string, details?: unknown) =>
  console.log(`[APPLE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const admin = serviceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const signedPayload = body?.signedPayload;
    if (typeof signedPayload !== "string") {
      log("Missing signedPayload");
      return new Response("ok", { status: 200 });
    }

    const payload = decodeJwsPayload<Record<string, any>>(signedPayload);
    const notificationType = payload?.notificationType ?? "UNKNOWN";
    const txnInfo = payload?.data?.signedTransactionInfo
      ? decodeJwsPayload<Record<string, any>>(payload.data.signedTransactionInfo)
      : null;

    const originalTransactionId =
      txnInfo?.originalTransactionId ?? payload?.data?.originalTransactionId ?? null;

    log("Notification received", { notificationType, originalTransactionId });

    if (!originalTransactionId) return new Response("ok", { status: 200 });

    // Which account owns this receipt? Unknown receipts are ignored: the app
    // will bind them on the next verify-apple-purchase call.
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id,user_id")
      .eq("original_transaction_id", String(originalTransactionId))
      .maybeSingle();

    if (!existing) {
      log("Receipt not linked to any account yet — ignoring");
      return new Response("ok", { status: 200 });
    }

    // Authoritative re-fetch: never trust the notification's own claims.
    const state = await getAppleSubscriptionState(String(originalTransactionId));
    if (!state) {
      await admin
        .from("subscriptions")
        .update({ subscription_status: "expired", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      await syncSubscribersCache(admin, existing.user_id);
      return new Response("ok", { status: 200 });
    }

    const plan = planFromAppleProduct(state.productId);
    const status = appleStatusToLedger(state.status, state.autoRenew) as Status;
    const refunded = notificationType === "REFUND" || notificationType === "REVOKE";

    await admin
      .from("subscriptions")
      .update({
        plan: plan === "free" ? undefined : plan,
        subscription_status: refunded ? "refunded" : status,
        current_period_end: state.expiresDate ? new Date(state.expiresDate).toISOString() : null,
        auto_renew: state.autoRenew,
        is_trial: state.isTrial,
        raw_payload: { notificationType, appleStatus: state.status },
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    await syncSubscribersCache(admin, existing.user_id);
    log("Entitlement updated", { plan, status: refunded ? "refunded" : status });

    return new Response("ok", { status: 200 });
  } catch (error) {
    log("ERROR", { message: error instanceof Error ? error.message : String(error) });
    // Always 200 so Apple does not hammer retries on our own bugs.
    return new Response("ok", { status: 200 });
  }
});
