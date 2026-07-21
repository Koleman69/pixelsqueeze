(function () {
  if (!("serviceWorker" in navigator)) return;

  var appShellWorkerPattern = /\/(sw|service-worker)\.js(?:$|[?#])/;
  var appShellCachePattern = /workbox|vite-pwa|(^|-)precache-v\d+-|(^|-)precache-|(^|-)runtime-|(^|-)googleAnalytics-/i;

  function settle(promises) {
    return Promise.all(
      promises.map(function (promise) {
        return Promise.resolve(promise).catch(function () {});
      }),
    );
  }

  function registrationScriptUrl(registration) {
    var active = registration.active && registration.active.scriptURL;
    var waiting = registration.waiting && registration.waiting.scriptURL;
    var installing = registration.installing && registration.installing.scriptURL;
    return active || waiting || installing || "";
  }

  function unregisterWorkers() {
    return navigator.serviceWorker.getRegistrations().then(function (registrations) {
      return settle(
        registrations
          .filter(function (registration) {
            return appShellWorkerPattern.test(registrationScriptUrl(registration));
          })
          .map(function (registration) {
            return registration.unregister();
          }),
      );
    });
  }

  function deleteCaches() {
    if (!("caches" in window)) return Promise.resolve();

    return caches.keys().then(function (cacheNames) {
      return settle(
        cacheNames
          .filter(function (name) {
            return appShellCachePattern.test(name);
          })
          .map(function (name) {
            return caches.delete(name);
          }),
      );
    });
  }

  unregisterWorkers()
    .then(deleteCaches)
    .catch(function (error) {
      console.warn("PixelSqueeze cache cleanup skipped", error);
    });
})();