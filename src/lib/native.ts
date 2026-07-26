/**
 * Native (Capacitor) bootstrap.
 *
 * Safe to call in a browser: every plugin call is guarded by
 * `Capacitor.isNativePlatform()`, so the same code runs unchanged as a PWA
 * and as an iOS app. Nothing here is required for the web build.
 */
import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform();

let initialized = false;

export async function initNative() {
  if (initialized || !isNative()) return;
  initialized = true;

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Light background -> dark content
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
  } catch (e) {
    console.warn("[native] StatusBar unavailable", e);
  }

  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    await SplashScreen.hide({ fadeOutDuration: 200 });
  } catch (e) {
    console.warn("[native] SplashScreen unavailable", e);
  }

  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", (info) => {
      document.documentElement.style.setProperty(
        "--keyboard-height",
        `${info.keyboardHeight}px`,
      );
      document.documentElement.dataset.keyboard = "open";
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-height", "0px");
      delete document.documentElement.dataset.keyboard;
    });
  } catch (e) {
    console.warn("[native] Keyboard unavailable", e);
  }

  try {
    const { App } = await import("@capacitor/app");
    // Deep links: pixelsqueeze://auth/callback  or  https://pixelsqueeze.app/…
    App.addListener("appUrlOpen", ({ url }) => {
      try {
        const parsed = new URL(url);
        // Strip scheme + host so react-router handles the in-app route.
        const path = parsed.pathname + parsed.search + parsed.hash;
        if (path && path !== "/") {
          window.history.pushState({}, "", path);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      } catch {
        // Ignore malformed URLs.
      }
    });
  } catch (e) {
    console.warn("[native] App listener unavailable", e);
  }
}

/** Fire a short haptic. No-op on web. */
export async function haptic(kind: "light" | "medium" | "heavy" = "light") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const style =
      kind === "heavy"
        ? ImpactStyle.Heavy
        : kind === "medium"
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
    await Haptics.impact({ style });
  } catch {
    /* ignore */
  }
}

/**
 * Open an external URL. On native we use SFSafariViewController via
 * Capacitor Browser so links don't kick the user out of the app.
 */
export async function openExternal(url: string) {
  if (!isNative()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url, presentationStyle: "popover" });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/** Subscribe to online/offline changes. Returns unsubscribe. */
export async function onNetworkChange(
  cb: (online: boolean) => void,
): Promise<() => void> {
  if (!isNative()) {
    const handler = () => cb(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    handler();
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }
  const { Network } = await import("@capacitor/network");
  const status = await Network.getStatus();
  cb(status.connected);
  const sub = await Network.addListener("networkStatusChange", (s) =>
    cb(s.connected),
  );
  return () => sub.remove();
}
