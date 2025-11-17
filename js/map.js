let visitedPlaces = [];
let map;
const DEBOUNCE_DELAY = 500;
let debounceTimeout = null;

function loadPlaces() {
  try {
    const data = localStorage.getItem('visitedPlaces');
    visitedPlaces = JSON.parse(data || '[]')
      .map(p => ({
        name: p.name?.trim() || '',
        city: p.city?.trim() || '',
        desc: p.desc?.trim() || '',
        lat: parseFloat(p.lat) || 0,
        lon: parseFloat(p.lon) || 0,
      }))
      .filter(p => p.name && p.lat && p.lon);
  } catch {
    showToast('Map loading error', 4000);
    visitedPlaces = [];
  }
}

function savePlaces() {
  try {
    localStorage.setItem('visitedPlaces', JSON.stringify(visitedPlaces));
  } catch {
    showToast('Error while saving', 4000);
  }
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(
    /[&<>"']/g,
    tag =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[tag])
  );
}

function validatePlace(data) {
  const errors = [];
  if (!data.name) errors.push(getTranslation('enterNamePrompt'));
  if (!data.city) errors.push(getTranslation('enterCityPrompt'));
  if (!data.desc) errors.push(getTranslation('enterDescriptionPrompt'));
  return errors;
}

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) return showToast('Map element missing', 4000);

  map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  map.on('click', e => showAddForm(e.latlng));
  loadPlaces();
  visitedPlaces.forEach(addMarker);
}

function showAddForm(latlng) {
  const form = document.createElement('div');
  form.className = 'card map-form-overlay';

  const title = document.createElement('h3');
  title.textContent = getTranslation('addPlaceTitle') || 'Dodaj miejsce';
  form.appendChild(title);

  const inputs = [
    { id: 'map-name', placeholder: getTranslation('enterNamePrompt') },
    { id: 'map-city', placeholder: getTranslation('enterCityPrompt') },
  ];

  inputs.forEach(input => {
    const el = document.createElement('input');
    el.type = 'text';
    el.id = input.id;
    el.placeholder = input.placeholder;
    form.appendChild(el);
  });

  const textarea = document.createElement('textarea');
  textarea.id = 'map-desc';
  textarea.placeholder = getTranslation('enterDescriptionPrompt');
  textarea.className = 'map-desc';
  form.appendChild(textarea);

  const actions = document.createElement('div');
  actions.className = 'trip-edit edit-actions';

  const btnSave = document.createElement('button');
  btnSave.textContent = getTranslation('saveButton') || 'Zapisz';
  btnSave.className = 'btn-save';

  const btnCancel = document.createElement('button');
  btnCancel.textContent = getTranslation('cancelButton') || 'Anuluj';
  btnCancel.className = 'btn-cancel';

  const disableMap = () => {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
  };

  const enableMap = () => {
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
  };

  const closeAndEnable = () => {
    form.remove();
    enableMap();
  };

  actions.append(btnSave, btnCancel);
  form.appendChild(actions);
  document.body.appendChild(form);
  disableMap();

  btnCancel.onclick = closeAndEnable;

  btnSave.onclick = () => {
    const data = {
      name: document.getElementById('map-name')?.value?.trim() ?? '',
      city: document.getElementById('map-city')?.value?.trim() ?? '',
      desc: document.getElementById('map-desc')?.value?.trim() ?? '',
      lat: latlng.lat,
      lon: latlng.lng,
    };

    const errors = validatePlace(data);
    if (errors.length > 0) {
      errors.forEach(err => showToast(err, 3000));
      return;
    }

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      visitedPlaces.push(data);
      savePlaces();
      addMarker(data);
      closeAndEnable();
    }, DEBOUNCE_DELAY);
  };
}

function addMarker(place) {
  if (!place.lat || !place.lon) return;

  const marker = L.marker([place.lat, place.lon]).addTo(map);
  const popup = createPopup(place);
  marker.bindPopup(popup);

  marker.on('popupopen', () => {
    const btn = popup.querySelector('.btn-delete');
    if (btn) {
      btn.onclick = () => {
        map.removeLayer(marker);
        visitedPlaces = visitedPlaces.filter(
          p => p.lat !== place.lat || p.lon !== place.lon
        );
        savePlaces();
      };
    }
  });
}

function createPopup(place) {
  const popup = document.createElement('div');
  popup.style.minWidth = '180px';

  const name = document.createElement('b');
  name.textContent = `${getTranslation('nameLabel')}: ${escapeHTML(
    place.name
  )}`;
  popup.appendChild(name);
  popup.appendChild(document.createElement('br'));

  const city = document.createElement('span');
  city.textContent = `${getTranslation('cityLabel')}: ${escapeHTML(
    place.city
  )}`;
  popup.appendChild(city);
  popup.appendChild(document.createElement('br'));

  const desc = document.createElement('span');
  desc.textContent = `${getTranslation('descriptionLabel')}: ${escapeHTML(
    place.desc
  )}`;
  popup.appendChild(desc);
  popup.appendChild(document.createElement('br'));

  const btnDelete = document.createElement('button');
  btnDelete.className = 'btn-delete';
  btnDelete.textContent = getTranslation('deleteButton');
  popup.appendChild(btnDelete);

  return popup;
}

function updateUI() {
  const h1 = document.querySelector('header h1');
  if (h1) h1.textContent = getTranslation('mapTitle');
  updateNavUI();
}

window.addEventListener('load', () => {
  initMap();
  updateUI();

  document.addEventListener('languageChange', () => {
    updateUI();
    map.eachLayer(layer => {
      if (layer instanceof L.Marker && layer.getPopup()) {
        const latlng = layer.getLatLng();
        const place = visitedPlaces.find(
          p => p.lat === latlng.lat && p.lon === latlng.lng
        );
        if (place) layer.setPopupContent(createPopup(place));
      }
    });
  });
});
