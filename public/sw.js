// NetData Service Worker — PWA 离线支持
const CACHE = 'netdata-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        '/',
        '/index.html',
        '/css/main.css',
        '/js/device-info.js',
        '/js/connection-settings.js',
        '/js/file-upload.js',
        '/manifest.json'
      ])
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
