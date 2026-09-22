/* 离线缓存 Service Worker: 页面 network-first(保证拿到最新),静态资源 cache-first */
const CACHE = 'paipan-v4'; // 每次发布更新页面时递增此版本号,强制刷新缓存
const ASSETS = [
  './',
  './index.html',
  './十二神.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  var isPage = e.request.mode === 'navigate' || url.indexOf('.html') >= 0 || url.endsWith('/');
  if (isPage) {
    // 页面: network-first,保证拿到最新;断网回退缓存
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
  } else {
    // 静态资源(图标等): cache-first
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          return res;
        });
      })
    );
  }
});
