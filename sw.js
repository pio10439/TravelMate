const CACHE_VERSION = 'v11';
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
  '/src/weather.js',
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
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Error/cache.addAll ', err);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('travelmate-') && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .catch(err => {
        console.error('Error/activate', err);
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    url.hostname.includes('api.weatherapi.com') ||
    url.hostname.includes('nominatim')
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match('/offline.html');
        }
      })()
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response && response.ok) {
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
