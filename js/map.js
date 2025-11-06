const map = L.map('map').setView([0, 0], 2); // Widok na srodek swiata i zoom 2
// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);
// Zapis odwiedzonych miejsc
let visitedPlaces = JSON.parse(localStorage.getItem('visitedPlaces') || '[]');
// Tlumaczenia
function updateMapUI() {
  document.querySelector('header h1').textContent = getTranslation(
    'mapTitle',
    translations
  );
  updateNavUI();
}

function addVisitedMarker(place) {
  if (!place.lat || !place.lon) return;
  // Marker z popupem
  const marker = L.marker([place.lat, place.lon]).addTo(map).bindPopup(`
    <b>${getTranslation('nameLabel', translations)}: ${place.name}</b><br>
    ${getTranslation('cityLabel', translations)}: ${place.city}<br>
    ${getTranslation('descriptionLabel', translations)}: ${place.desc}<br>
    ${place.photo ? `<img src="${place.photo}" width="100">` : ''}<br>
    <button class="delete-btn">${getTranslation(
      'deleteButton',
      translations
    )}</button>
  `);
  // Usuwanie
  marker.on('popupopen', () => {
    const btn = document.querySelector('.delete-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        map.removeLayer(marker);
        visitedPlaces = visitedPlaces.filter(
          p => p.name !== place.name || p.city !== place.city
        );
        localStorage.setItem('visitedPlaces', JSON.stringify(visitedPlaces));
      });
    }
  });
}
// Ladowanie miejsc po otworzeniu apki
visitedPlaces.forEach(addVisitedMarker);
//Dodanie miejsc przy uzyciu promptow
map.on('click', function (e) {
  const name = prompt(getTranslation('enterNamePrompt', translations));
  if (!name) return;

  const city = prompt(getTranslation('enterCityPrompt', translations));
  const desc = prompt(getTranslation('enterDescriptionPrompt', translations));

  const newPlace = {
    name,
    city,
    desc,
    lat: e.latlng.lat,
    lon: e.latlng.lng,
    photo: '',
  };
  //Zapis
  visitedPlaces.push(newPlace);
  localStorage.setItem('visitedPlaces', JSON.stringify(visitedPlaces));
  addVisitedMarker(newPlace);
});

window.addEventListener('load', () => {
  updateMapUI();
});
// Aktualizacja popupow po zmianie jezyka
document.addEventListener('languageChange', () => {
  updateMapUI();
  map.eachLayer(layer => {
    if (layer instanceof L.Marker && layer.getPopup()) {
      const place = visitedPlaces.find(
        p => p.lat === layer.getLatLng().lat && p.lon === layer.getLatLng().lng
      );
      if (place) {
        layer.setPopupContent(`
          <b>${getTranslation('nameLabel', translations)}: ${place.name}</b><br>
          ${getTranslation('cityLabel', translations)}: ${place.city}<br>
          ${getTranslation('descriptionLabel', translations)}: ${place.desc}<br>
          ${place.photo ? `<img src="${place.photo}" width="100">` : ''}<br>
          <button class="delete-btn">${getTranslation(
            'deleteButton',
            translations
          )}</button>
        `);
      }
    }
  });
});
