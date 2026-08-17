/**
 * Google Play Real-time Developer Notifications (RTDN) endpoint.
 *
 * Google Cloud Pub/Sub pushes a base64 message here. As with Apple, the message
 * is used only to read the purchase token; the real state is re-fetched from the
 * Play Developer API, so a forged push cannot grant or revoke a plan.
 *
 * Set this URL as the push endpoint of the Pub/Sub subscription attached to the
 * RTDN topic configured in Play Console > Monetization setup.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  getGooglePurchaseState,
  googleStateToLedger,
} from "../_shared/playstore.ts";
import {
  planFromGoogleProduct,
  serviceClient,
  syncSubscribersCache,
  type Status,
} from "../_shared/entitlements.ts";

const log = (step: string, details?: unknown) =>
  console.log(`[GOOGLE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

function decodePubSubMessage(body: any): Record<string, any> | null {
  const data = body?.message?.data;
  if (typeof data !== "string") return null;
  try {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const admin = serviceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const message = decodePubSubMessage(body);
    const purchaseToken =
      message?.subscriptionNotification?.purchaseToken ??
      message?.voidedPurchaseNotification?.purchaseToken ??
      null;

    log("Notification received", {
      type: message?.subscriptionNotification?.notificationType ?? "other",
      hasToken: Boolean(purchaseToken),
    });

    if (!purchaseToken) return new Response("ok", { status: 200 });

    const { data: existing } = await admin
      .from("subscriptions")
      .select("id,user_id")
      .eq("purchase_token", String(purchaseToken))
      .maybeSingle();

    if (!existing) {
      log("Purchase token not linked to any account yet — ignoring");
      return new Response("ok", { status: 200 });
    }

    // Voided purchases (refund / chargeback) revoke access immediately.
    if (message?.voidedPurchaseNotification) {
      await admin
        .from("subscriptions")
        .update({ subscription_status: "refunded", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      await syncSubscribersCache(admin, existing.user_id);
      log("Purchase voided — access revoked");
      return new Response("ok", { status: 200 });
    }

    const state = await getGooglePurchaseState(String(purchaseToken));
    if (!state) {
      await admin
        .from("subscriptions")
        .update({ subscription_status: "expired", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      await syncSubscribersCache(admin, existing.user_id);
      return new Response("ok", { status: 200 });
    }

    const plan = planFromGoogleProduct(state.productId, state.basePlanId);
    const status = googleStateToLedger(state.state, state.autoRenew) as Status;

    await admin
      .from("subscriptions")
      .update({
        plan: plan === "free" ? undefined : plan,
        product_id: state.productId,
        base_plan_id: state.basePlanId,
        subscription_status: status,
        current_period_end: state.expiryTime,
        auto_renew: state.autoRenew,
        is_trial: state.isTrial,
        raw_payload: { subscriptionState: state.state },
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    await syncSubscribersCache(admin, existing.user_id);
    log("Entitlement updated", { plan, status });

    return new Response("ok", { status: 200 });
  } catch (error) {
    log("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response("ok", { status: 200 });
  }
});
