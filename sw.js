/* EVN-SPC – CT HẰNG NGÀY TKD TB (PWA)
 * Strategy:
 *  - navigate: network-first with offline fallback
 *  - static assets: cache-first
 *  - works on GitHub Pages subpath thanks to BASE
 */
const BASE = new URL('./', self.location).pathname;        // ví dụ "/ten-repo/" hoặc "/"
const CACHE = 'ct-tkdtb-v1';
const STATIC_ASSETS = [
  BASE,                            // redirect to index
  BASE + 'index.html',
  BASE + 'manifest.webmanifest',
  BASE + 'icon-192-any.png',
  BASE + 'icon-512-any.png',
  BASE + 'icon-192-maskable.png',
  BASE + 'icon-512-maskable.png',
  BASE + 'evn_logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : 0)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // chỉ xử lý same-origin + trong scope BASE
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  // Điều hướng (HTML)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(BASE + 'index.html')) || Response.error();
      }
    })());
    return;
  }

  // Static: cache-first
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreVary: true });
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok && req.method === 'GET') cache.put(req, res.clone());
    return res;
  })());
});

// Cho phép nút "Làm mới" bỏ qua waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
