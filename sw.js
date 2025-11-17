const CACHE_VERSION = 'v10';
const CACHE_NAME = `travelmate-cache-${CACHE_VERSION}`;
const MAX_CACHE_ITEMS = 50;

const APP_ASSETS = [
  '/',
  '/index.html',
  '/add-trip.html',
  '/map.html',
  '/weather.html',
  '/settings.html',
  '/offline.html',
  '/css/style.css',
  '/js/utils.js',
  '/js/theme.js',
  '/js/main.js',
  '/js/add-trip.js',
  '/js/map.js',
  '/js/weather.js',
  '/js/settings.js',
  '/js/toast.js',
  '/translations/nav-translation.js',
  '/translations/translation.js',
  '/translations/map-translations.js',
  '/translations/weather-translations.js',
  '/translations/settings-translations.js',
  '/manifest.webmanifest',
  'https://unpkg.com/leaflet/dist/leaflet.js',
  'https://unpkg.com/leaflet/dist/leaflet.css',
  '/images/business-trip.png',
  '/images/travel-bag.png',
  '/images/favicon.png',
  '/images/photo180.png',
];

const EXTERNAL_ASSETS = [
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll([...APP_ASSETS, ...EXTERNAL_ASSETS]);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(key => key.startsWith('travelmate-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    url.hostname.includes('api.weatherapi.com') ||
    url.hostname.includes('nominatim.openstreetmap.org')
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, response.clone());
              trimCache(CACHE_NAME, MAX_CACHE_ITEMS);
            });
          }
          return response;
        })
        .catch(() => new Response('', { status: 504 }));
    })
  );
});
