// Kill-switch service worker: evicts previous app-shell PWA registrations
// and their Workbox/VitePWA caches, then unregisters itself so Safari/Chrome
// stop serving stale or broken cached HTML.
function includes(haystack, needle) {
  return haystack.indexOf(needle) !== -1;
}

function isAppShellCacheForThisRegistration(name) {
  var scope = self.registration.scope;
  var normalizedScope = scope.charAt(scope.length - 1) === "/" ? scope.slice(0, -1) : scope;
  var hasAppShellBucket = /workbox|vite-pwa|(^|-)precache-v\d+-|(^|-)precache-|(^|-)runtime-|(^|-)googleAnalytics-/i.test(name);
  var belongsToThisOrigin = includes(name, scope) || includes(name, normalizedScope) || includes(name, "pixelsqueeze");

  return hasAppShellBucket && belongsToThisOrigin;
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
  // Force network while cleanup is active so stale HTML/chunks are not served.
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
        await Promise.all(appShellCacheNames.map((name) => caches.delete(name).catch(() => {})));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.all(windowClients.map((client) => client.navigate(client.url).catch(() => {})));
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);
