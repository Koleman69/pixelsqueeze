// Secondary kill-switch path for any older app-shell worker that registered as
// /service-worker.js. Keep messaging workers on separate filenames untouched.
function isAppShellCacheForThisRegistration(name) {
  const scope = self.registration.scope;
  const normalizedScope = scope.endsWith("/") ? scope.slice(0, -1) : scope;
  const hasAppShellBucket = /workbox|vite-pwa|(^|-)precache-v\d+-|(^|-)precache-|(^|-)runtime-|(^|-)googleAnalytics-/i.test(name);
  const belongsToThisOrigin = name.includes(scope) || name.includes(normalizedScope) || name.includes("pixelsqueeze");

  return hasAppShellBucket && belongsToThisOrigin;
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(fetch(event.request, { cache: "reload" }).catch(() => Response.error()));
  }
});

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const appShellCacheNames = cacheNames.filter(isAppShellCacheForThisRegistration);
        await Promise.allSettled(appShellCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);