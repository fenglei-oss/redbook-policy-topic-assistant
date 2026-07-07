const CACHE_NAME = 'redbook-policy-topic-assistant-v1';
const APP_ROOT = new URL('./', self.location.href).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch(APP_ROOT)
      .then(async (response) => {
        const cache = await caches.open(CACHE_NAME);
        const html = await response.clone().text();
        const assetUrls = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g))
          .map((match) => match[1])
          .filter((url) => url.startsWith('/'));

        await cache.put(APP_ROOT, response);
        await Promise.all(assetUrls.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/news-proxy/')) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }

        if (request.mode === 'navigate') {
          const appShell = await caches.match(APP_ROOT);
          return appShell || Response.error();
        }

        return Response.error();
      })
  );
});
