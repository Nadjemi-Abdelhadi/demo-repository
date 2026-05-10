const CACHE_NAME = 'zalo-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = event.request.url;

  if (url.includes('dashboard.html')) {
    return event.respondWith(fetch(event.request));
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
