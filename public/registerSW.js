(async () => {
  if (!("serviceWorker" in navigator)) return;

  const isAppShellWorker = (url) => /\/(sw|service-worker)\.js(?:$|[?#])/.test(url || "");
  const isAppShellCache = (name) => /workbox|vite-pwa|(^|-)precache-v\d+-|(^|-)precache-|(^|-)runtime-|(^|-)googleAnalytics-/i.test(name);

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((registration) => isAppShellWorker(registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL))
        .map((registration) => registration.unregister()),
    );

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.allSettled(cacheNames.filter(isAppShellCache).map((name) => caches.delete(name)));
    }
  } catch (error) {
    console.warn("PixelSqueeze cache cleanup skipped", error);
  }
})();