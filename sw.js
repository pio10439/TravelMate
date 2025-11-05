const CACHE_VERSION = 'v8';
const CACHE_NAME = `travelmate-cache-${CACHE_VERSION}`;

const APP_ASSETS = [
  '/',
  '/index.html',
  '/add-trip.html',
  '/map.html',
  '/weather.html',
  '/settings.html',
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
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_ASSETS))
      .catch(() => console.log('Niektóre pliki pominięte'))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(k => k.startsWith('travelmate-cache') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;

  if (
    request.url.includes('api.weatherapi.com') ||
    request.url.includes('nominatim')
  ) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/weather.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      const networkFetch = fetch(request)
        .then(response => {
          const clone = response.clone();
          if (response.ok && request.url.startsWith(self.location.origin)) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || caches.match('/index.html'));
      return cached || networkFetch;
    })
  );
});
