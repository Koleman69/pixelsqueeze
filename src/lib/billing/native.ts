/**
 * Native in-app purchase bridge (Apple StoreKit 2 / Google Play Billing).
 *
 * Uses cordova-plugin-purchase, which Capacitor loads at runtime and exposes as
 * `window.CdvPurchase`. It is intentionally accessed off the global instead of
 * imported so nothing store-related is pulled into the web bundle.
 *
 * The store is never the source of truth for access: after any successful
 * purchase we hand the receipt to an edge function, which verifies it with
 * Apple/Google and writes the entitlement. The app then re-reads its plan.
 */
import { supabase } from "@/integrations/supabase/client";
import { GOOGLE_LEGACY_PRODUCT_ID, PAID_PLANS, PLANS, type Plan } from "./plans";

/** Minimal shape we rely on from the plugin. */
type AnyRecord = Record<string, any>;

function getStore(): AnyRecord | null {
  const cdv = (window as AnyRecord).CdvPurchase;
  return cdv?.store ?? null;
}

export function isNativePurchaseAvailable(): boolean {
  return Boolean(getStore());
}

let initialized = false;
let initPromise: Promise<void> | null = null;

/** Register products and start the store exactly once per app session. */
export async function initNativeStore(): Promise<void> {
  const store = getStore();
  if (!store) throw new Error("In-app purchases are not available on this device.");
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const CdvPurchase = (window as AnyRecord).CdvPurchase;
    const { ProductType, Platform, LogLevel } = CdvPurchase;
    const platform =
      (window as AnyRecord).Capacitor?.getPlatform?.() === "ios"
        ? Platform.APPLE_APPSTORE
        : Platform.GOOGLE_PLAY;

    store.verbosity = LogLevel.WARNING;

    const isAndroid = platform === Platform.GOOGLE_PLAY;

    // Final structure: one product per tier (creator/pro/business.subscription).
    // On Android we also register the legacy single-product layout so a build
    // works against either Play Console configuration.
    const productIds = new Set(
      PAID_PLANS.map((plan) => PLANS[plan].storeProductId as string).filter(Boolean),
    );
    if (isAndroid) productIds.add(GOOGLE_LEGACY_PRODUCT_ID);

    store.register(
      [...productIds].map((id) => ({
        id,
        type: ProductType.PAID_SUBSCRIPTION,
        platform,
      })),
    );

    // Server-side verification: the plugin hands us the receipt, we ask our
    // edge functions to confirm it with the store before unlocking anything.
    store.validator = async (receipt: AnyRecord, callback: (res: AnyRecord) => void) => {
      try {
        await syncReceiptWithServer(receipt);
        callback({ ok: true, data: {} });
      } catch (error) {
        callback({
          ok: false,
          code: CdvPurchase.ErrorCode.VERIFICATION_FAILED,
          message: error instanceof Error ? error.message : "Verification failed",
        });
      }
    };

    store.when().approved((transaction: AnyRecord) => transaction.verify());
    store.when().verified((receipt: AnyRecord) => receipt.finish());

    await store.initialize([platform]);
    initialized = true;
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

/** Extract identifiers from a plugin receipt and verify them server-side. */
async function syncReceiptWithServer(receipt: AnyRecord): Promise<void> {
  const isApple =
    receipt?.platform === "ios-appstore" ||
    (window as AnyRecord).Capacitor?.getPlatform?.() === "ios";

  const transaction = receipt?.transactions?.[0] ?? receipt;

  if (isApple) {
    const originalTransactionId =
      transaction?.originalTransactionId ??
      transaction?.transactionId ??
      receipt?.originalTransactionId;

    const { data, error } = await supabase.functions.invoke("verify-apple-purchase", {
      body: {
        originalTransactionId: originalTransactionId ? String(originalTransactionId) : undefined,
        signedTransaction: transaction?.nativePurchase?.jwsRepresentation,
      },
    });
    if (error) throw new Error(error.message || "Could not verify your App Store purchase.");
    if (data?.error) throw new Error(String(data.error));
    return;
  }

  const purchaseToken =
    transaction?.purchaseToken ??
    transaction?.nativePurchase?.purchaseToken ??
    receipt?.purchaseToken;

  if (!purchaseToken) throw new Error("Missing Google Play purchase token.");

  const { data, error } = await supabase.functions.invoke("verify-google-purchase", {
    body: {
      purchaseToken: String(purchaseToken),
      productId: transaction?.products?.[0]?.id ?? transaction?.productId,
    },
  });
  if (error) throw new Error(error.message || "Could not verify your Google Play purchase.");
  if (data?.error) throw new Error(String(data.error));
}

/** Launch the native purchase sheet for a plan. */
/** Find the offer that matches a plan, across both Play Console layouts. */
function resolveOffer(store: AnyRecord, plan: Plan): AnyRecord | null {
  const productId = PLANS[plan].storeProductId;
  const basePlanId = PLANS[plan].googleBasePlanId;
  const isAndroid = (window as AnyRecord).Capacitor?.getPlatform?.() === "android";

  const candidates = [productId, isAndroid ? GOOGLE_LEGACY_PRODUCT_ID : null].filter(
    Boolean,
  ) as string[];

  for (const id of candidates) {
    const product = store.get?.(id);
    if (!product) continue;
    const offers: AnyRecord[] = product.offers ?? [];

    // Prefer the base plan that belongs to this tier (legacy layout keeps all
    // tiers under one product, so the base plan is what identifies the tier).
    if (basePlanId) {
      const matched = offers.find(
        (offer) => offer?.id === basePlanId || String(offer?.id ?? "").includes(basePlanId),
      );
      if (matched) return matched;
    }

    // Dedicated product for this tier: any offer on it is correct.
    if (id === productId) {
      const fallback = product.getOffer?.() ?? offers[0];
      if (fallback) return fallback;
    }
  }

  return null;
}

/** Store metadata for a plan, used to show real trial/pricing copy natively. */
export async function getNativePlanOffer(
  plan: Plan,
): Promise<{ price: string | null; trialDays: number | null } | null> {
  if (!getStore()) return null;
  try {
    await initNativeStore();
  } catch {
    return null;
  }
  const store = getStore();
  if (!store) return null;
  const offer = resolveOffer(store, plan);
  if (!offer) return null;

  const phases: AnyRecord[] = offer.pricingPhases ?? [];
  const paid = phases.find((phase) => Number(phase?.priceMicros ?? 1) > 0) ?? phases[0];
  const freePhase = phases.find((phase) => Number(phase?.priceMicros ?? 1) === 0);

  let trialDays: number | null = null;
  const period = String(freePhase?.billingPeriod ?? "");
  const match = /^P(\d+)([DWMY])$/.exec(period);
  if (match) {
    const value = Number(match[1]);
    trialDays =
      match[2] === "D" ? value : match[2] === "W" ? value * 7 : match[2] === "M" ? value * 30 : value * 365;
  }

  return { price: paid?.price ?? null, trialDays };
}

export async function purchaseNative(plan: Plan): Promise<void> {
  if (!PLANS[plan].storeProductId) throw new Error("This plan cannot be bought in the app.");

  await initNativeStore();
  const store = getStore();
  if (!store) throw new Error("In-app purchases are not available on this device.");

  const offer = resolveOffer(store, plan);
  if (!offer) throw new Error("This plan is not available in the store right now.");

  const error = await offer.order();
  if (error) {
    const code = (window as AnyRecord).CdvPurchase?.ErrorCode;
    if (code && error.code === code.PAYMENT_CANCELLED) return;
    throw new Error(error.message || "The purchase could not be completed.");
  }
}

/** "Restore purchases" — required by App Store review guidelines. */
export async function restoreNativePurchases(): Promise<void> {
  await initNativeStore();
  const store = getStore();
  await store?.restorePurchases();
}
