const CACHE_NAME = "pos-study-hub-v2";

const FILES_TO_CACHE = [
  "/"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  // Always fetch pages from GitHub first.
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.url.endsWith("/index.html")
  ) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // Other files use the network first, with cache as an offline fallback.
  if (new URL(request.url).origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
