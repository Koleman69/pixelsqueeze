import { supabase } from "@/integrations/supabase/client";

const WEB_ORIGIN = "https://pixelsqueeze.app";

/** Opens a checkout URL reliably on web, PWA and native (Capacitor) builds. */
export async function openCheckoutUrl(url: string) {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      await Browser.open({ url, presentationStyle: "popover" });
      return;
    }
  } catch {
    // Not a native build — fall through to a normal navigation.
  }
  // Popup blockers kill window.open after an await, so navigate in-tab.
  window.location.href = url;
}

/**
 * Starts a Stripe Checkout session.
 * Throws with a readable message so callers can toast it.
 */
export async function startCheckout(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "/auth";
    return;
  }

  // Capacitor webviews report origin as capacitor://localhost, which Stripe
  // cannot redirect back to — always give the function a real https origin.
  const origin =
    window.location.origin.startsWith("http") ? window.location.origin : WEB_ORIGIN;

  const { data, error } = await supabase.functions.invoke("create-checkout", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "x-app-origin": origin,
    },
  });

  if (error) throw new Error(error.message || "Could not start checkout");
  if (!data?.url) throw new Error(data?.error || "No checkout URL returned");

  await openCheckoutUrl(data.url);
}
