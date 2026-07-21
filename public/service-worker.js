// Secondary kill-switch path for any older app-shell worker that registered as
// /service-worker.js. Keep messaging workers on separate filenames untouched.
function isAppShellCacheForThisRegistration(name) {
  var scope = self.registration.scope;
  var normalizedScope = scope.charAt(scope.length - 1) === "/" ? scope.slice(0, -1) : scope;
  var hasAppShellBucket = /workbox|vite-pwa|(^|-)precache-v\d+-|(^|-)precache-|(^|-)runtime-|(^|-)googleAnalytics-/i.test(name);
  var belongsToThisOrigin = name.indexOf(scope) !== -1 || name.indexOf(normalizedScope) !== -1 || name.indexOf("pixelsqueeze") !== -1;

  return hasAppShellBucket && belongsToThisOrigin;
}

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("fetch", function (event) {
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