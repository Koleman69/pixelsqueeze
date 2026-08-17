/**
 * Billing facade: one API for the UI, correct provider underneath.
 *
 *   web / PWA  -> Stripe Checkout
 *   iOS        -> Apple StoreKit (App Store rules require it)
 *   Android    -> Google Play Billing
 *
 * Supabase is the entitlement source of truth for all three, so a plan bought
 * on the phone works on the website and vice versa.
 */
import { supabase } from "@/integrations/supabase/client";
import { startCheckout, openCheckoutUrl } from "@/lib/checkout";
import { normalizePlan, type BillingPlatform, type BillingProvider, type Plan } from "./plans";

export * from "./plans";

/** Which platform is this build running on right now? */
export function getBillingPlatform(): BillingPlatform {
  const cap = (window as Record<string, any>).Capacitor;
  if (cap?.isNativePlatform?.()) {
    return cap.getPlatform() === "ios" ? "ios" : "android";
  }
  return "web";
}

export function isNativeBilling(): boolean {
  return getBillingPlatform() !== "web";
}

export interface Entitlement {
  plan: Plan;
  subscribed: boolean;
  provider: BillingProvider | null;
  platform: BillingPlatform;
  subscriptionEnd: string | null;
  isTrialing: boolean;
  trialEnd: string | null;
  complimentary: boolean;
  /** True only when the subscription can be managed from this app (Stripe web). */
  manageableHere: boolean;
}

export const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  subscribed: false,
  provider: null,
  platform: "web",
  subscriptionEnd: null,
  isTrialing: false,
  trialEnd: null,
  complimentary: false,
  manageableHere: false,
};

/** Read the caller's entitlement from the server. Never trust local state. */
export async function fetchEntitlement(): Promise<Entitlement> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return FREE_ENTITLEMENT;

  const { data, error } = await supabase.functions.invoke("check-subscription");
  if (error || !data || data.error) return FREE_ENTITLEMENT;

  return {
    plan: normalizePlan(data.plan ?? data.subscription_tier),
    subscribed: Boolean(data.subscribed),
    provider: (data.provider ?? null) as BillingProvider | null,
    platform: (data.platform ?? "web") as BillingPlatform,
    subscriptionEnd: data.subscription_end ?? null,
    isTrialing: Boolean(data.is_trialing),
    trialEnd: data.trial_end ?? null,
    complimentary: Boolean(data.complimentary),
    manageableHere: Boolean(data.manageable_here),
  };
}

/**
 * Buy a plan on whichever billing rail this platform requires.
 * Resolves once the flow has been handed off (or completed, on native).
 */
export async function subscribeToPlan(plan: Exclude<Plan, "free">): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/auth";
    return;
  }

  if (isNativeBilling()) {
    const { purchaseNative } = await import("./native");
    await purchaseNative(plan);
    return;
  }

  await startCheckout(plan);
}

/** Restore purchases (native) — no-op on web, where Stripe is authoritative. */
export async function restorePurchases(): Promise<void> {
  if (!isNativeBilling()) return;
  const { restoreNativePurchases } = await import("./native");
  await restoreNativePurchases();
}

/**
 * Send the user to the right place to cancel or change payment method.
 * Apple and Google forbid us from doing this ourselves, so we deep-link out.
 */
export async function manageSubscription(entitlement: Entitlement): Promise<void> {
  if (entitlement.provider === "apple") {
    await openCheckoutUrl("https://apps.apple.com/account/subscriptions");
    return;
  }
  if (entitlement.provider === "google") {
    await openCheckoutUrl("https://play.google.com/store/account/subscriptions");
    return;
  }
  if (entitlement.provider === "complimentary") {
    throw new Error("Your access is complimentary — there is nothing to manage.");
  }

  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw new Error(error.message || "Could not open the billing portal");
  if (!data?.url) throw new Error(data?.error || "Could not open the billing portal");
  await openCheckoutUrl(data.url);
}

/** Human-readable note about where a subscription is billed. */
export function billingSourceLabel(entitlement: Entitlement): string | null {
  switch (entitlement.provider) {
    case "apple":
      return "Billed through your Apple ID — manage it in App Store settings.";
    case "google":
      return "Billed through Google Play — manage it in Play Store subscriptions.";
    case "stripe":
      return "Billed on pixelsqueeze.app.";
    case "complimentary":
      return "Complimentary access — no charge, ever.";
    default:
      return null;
  }
}
