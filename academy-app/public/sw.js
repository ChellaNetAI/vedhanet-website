// Minimal service worker: no offline caching (this app is login-gated and
// dynamic, so caching pages/API responses risks showing stale or wrong-
// account data). Its only job is to exist and handle fetch, which is what
// browsers require before they'll offer "Add to Home Screen" / install.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
