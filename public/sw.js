// Kill-switch service worker: evicts the previous vite-plugin-pwa registration
// and its Workbox caches, then unregisters itself so the site serves fresh HTML.
function isWorkboxCacheForThisRegistration(name) {
  const hasWorkboxBucket = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
  return hasWorkboxBucket && name.endsWith(self.registration.scope);
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("fetch", (event) => {
  // Force network for navigations so stale HTML is not served during cleanup.
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => Response.error()));
  }
});

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const workboxCacheNames = cacheNames.filter(isWorkboxCacheForThisRegistration);
        await Promise.allSettled(workboxCacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
