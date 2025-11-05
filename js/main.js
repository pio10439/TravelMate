let trips = JSON.parse(localStorage.getItem('trips') || '[]');
const tripList = document.getElementById('trip-list');
let pendingPhoto = null;
let currentEditForm = null;

function renderTrips() {
  trips.sort((a, b) =>
    a.completed === b.completed ? 0 : a.completed ? 1 : -1
  );
  if (trips.length === 0) {
    tripList.innerHTML = `<p class="no-trips">${
      getTranslation('noTrips', translations) ||
      'No trips yet. Add your first one!'
    }</p>`;
    return;
  }

  tripList.innerHTML = trips
    .map((trip, idx) => {
      const name = trip.name || '—';
      const city = trip.city || '—';
      const currentCity = trip.currentCity || '—';
      const desc = trip.desc || '';

      const formattedDesc =
        desc
          .split(/\.\s+/)
          .map(p => p.trim())
          .filter(Boolean)
          .map(p =>
            p.includes('·')
              ? p
                  .split('·')
                  .map(l => l.trim())
                  .filter(Boolean)
                  .map(l => `• ${l}`)
                  .join('<br>')
              : `• ${p}`
          )
          .join('<br>') || '—';

      return `
      <li class="trip-item ${
        trip.completed ? 'completed' : ''
      }" data-id="${idx}">
        <div class="trip-view">
          <h3>${name}</h3>
          <p><strong>${getTranslation('destinationLabel')}:</strong> ${city}</p>
          <p class="trip-desc">${formattedDesc}</p>
          ${
            trip.photo
              ? `<img src="${
                  trip.photo
                }" class="trip-photo" alt="${getTranslation('tripPhotoAlt')}">`
              : ''
          }
          <p><strong>${getTranslation(
            'currentLocationDisplay'
          )}</strong> ${currentCity}</p>

          <label class="checkbox-label">
            <input type="checkbox" data-index="${idx}" ${
        trip.completed ? 'checked' : ''
      }>
            ${getTranslation('markAsVisited')}
          </label>

          <div class="trip-actions">
            <button class="btn-edit" data-action="edit" data-index="${idx}">${getTranslation(
        'editButton'
      )}</button>
            <button class="btn-delete" data-action="delete" data-index="${idx}">${getTranslation(
        'deleteButton'
      )}</button>
          </div>
        </div>

        <div class="trip-edit card" style="display:none">
          <form class="edit-form" data-id="${idx}">
            <div class="setting-item">
              <label>${getTranslation('tripNamePlaceholder')}</label>
              <input type="text" class="edit-name" value="${name}" placeholder="${getTranslation(
        'tripNamePlaceholder'
      )}" required>
            </div>
            <div class="setting-item">
              <label>${getTranslation('tripCityPlaceholder')}</label>
              <input type="text" class="edit-city" value="${city}" placeholder="${getTranslation(
        'tripCityPlaceholder'
      )}" required>
            </div>
            <div class="setting-item">
              <label>${getTranslation('tripDescPlaceholder')}</label>
              <textarea class="edit-desc" placeholder="${getTranslation(
                'tripDescPlaceholder'
              )}" required>${desc}</textarea>
            </div>

            <div class="photo-preview-container" style="margin:15px 0; text-align:center; display:none">
              <img class="edit-photo-preview" style="max-width:100%; border-radius:8px;">
            </div>

            <div class="photo-section">
              <button type="button" class="photo-btn" data-type="camera">${getTranslation(
                'photoFromCamera'
              )}</button>
              <button type="button" class="photo-btn" data-type="gallery">${getTranslation(
                'photoFromGallery'
              )}</button>
            </div>
            <input type="file" class="edit-camera" accept="image/*" capture="environment" style="display:none">
            <input type="file" class="edit-gallery" accept="image/*" style="display:none">

            <div class="edit-actions">
              <button type="submit" class="btn-save">${getTranslation(
                'saveTripButton'
              )}</button>
              <button type="button" class="btn-cancel">${getTranslation(
                'cancelButton'
              )}</button>
            </div>
          </form>
        </div>
      </li>
    `;
    })
    .join('');
}

function saveTrips() {
  localStorage.setItem('trips', JSON.stringify(trips));
}

tripList.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"]')) {
    const idx = +e.target.dataset.index;
    trips[idx].completed = e.target.checked;
    saveTrips();
    renderTrips();
  }

  if (e.target.matches('.edit-camera, .edit-gallery')) {
    const file = e.target.files[0];
    if (!file) return;

    const li = e.target.closest('li');
    currentEditForm = li.querySelector('.edit-form');
    const container = currentEditForm.querySelector('.photo-preview-container');
    const img = container.querySelector('.edit-photo-preview');

    const reader = new FileReader();
    reader.onload = ev => {
      pendingPhoto = ev.target.result;
      img.src = pendingPhoto;
      container.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

tripList.addEventListener('click', e => {
  const btn = e.target;
  if (!btn.matches('button')) return;

  const li = btn.closest('li');
  const idx = +li.dataset.id;

  if (btn.classList.contains('btn-edit')) {
    li.querySelector('.trip-view').style.display = 'none';
    li.querySelector('.trip-edit').style.display = 'block';
    pendingPhoto = null;
    currentEditForm = li.querySelector('.edit-form');
    currentEditForm.querySelector('.photo-preview-container').style.display =
      'none';
    return;
  }

  if (btn.classList.contains('btn-delete')) {
    if (
      confirm(
        getTranslation('confirmDelete', translations) ||
          'Are you sure you want to delete this trip?'
      )
    ) {
      trips.splice(idx, 1);
      saveTrips();
      renderTrips();
    }
    return;
  }

  if (btn.classList.contains('photo-btn')) {
    const type = btn.dataset.type;
    li.querySelector(`.edit-${type}`).click();
    return;
  }

  if (btn.classList.contains('btn-cancel')) {
    pendingPhoto = null;
    renderTrips();
  }
});

tripList.addEventListener('submit', e => {
  if (!e.target.matches('.edit-form')) return;
  e.preventDefault();

  const idx = +e.target.dataset.id;
  trips[idx].name = e.target.querySelector('.edit-name').value.trim();
  trips[idx].city = e.target.querySelector('.edit-city').value.trim();
  trips[idx].desc = e.target.querySelector('.edit-desc').value.trim();

  if (pendingPhoto) {
    trips[idx].photo = pendingPhoto;
    pendingPhoto = null;
  }

  saveTrips();
  renderTrips();
});

function updateUI() {
  document.querySelector('header h1').textContent = getTranslation(
    'dashboardTitle',
    translations
  );
  document.querySelector('main h2').textContent = getTranslation(
    'yourTrips',
    translations
  );
  renderTrips();
  updateNavUI();
}

window.addEventListener('load', updateUI);
document.addEventListener('languageChange', updateUI);
window.addEventListener('online', updateUI);
window.addEventListener('offline', updateUI);
