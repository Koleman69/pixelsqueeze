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
import { PLANS, type Plan } from "./plans";

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

    store.register(
      (["creator", "pro", "business"] as Plan[]).map((plan) => ({
        id: PLANS[plan].storeProductId as string,
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
export async function purchaseNative(plan: Plan): Promise<void> {
  const productId = PLANS[plan].storeProductId;
  if (!productId) throw new Error("This plan cannot be bought in the app.");

  await initNativeStore();
  const store = getStore();
  const product = store?.get(productId);
  if (!product) throw new Error("This plan is not available in the store right now.");

  const offer = product.getOffer?.() ?? product.offers?.[0];
  if (!offer) throw new Error("No purchase option available for this plan.");

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
