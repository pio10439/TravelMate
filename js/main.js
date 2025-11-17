let trips = JSON.parse(localStorage.getItem('trips') || '[]');
const tripList = document.getElementById('trip-list');
let pendingPhoto = null;
let currentEditForm = null;

if (!tripList) throw new Error('Trip list element not found');

trips = trips.map(trip => ({ ...trip, completed: !!trip.completed }));

function saveTrips() {
  try {
    localStorage.setItem('trips', JSON.stringify(trips));
  } catch (err) {
    console.error('Error saving trips:', err);
    showToast('Błąd zapisu!', 4000);
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

// Tworzenie elementu
function createElement(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'style') Object.assign(el.style, value);
    else if (key.startsWith('on'))
      el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'checked') el.checked = !!value;
    else el.setAttribute(key, value);
  }
  if (children.length) el.append(...children.filter(Boolean));
  return el;
}

function formatDesc(desc) {
  if (!desc) return '—';
  return desc
    .split(/\.\s+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p =>
      p.includes('·')
        ? p
            .split('·')
            .map(l => `• ${escapeHTML(l.trim())}`)
            .join('\n')
        : `• ${escapeHTML(p)}`
    )
    .join('\n');
}

function createTripItem(trip, idx) {
  const li = createElement('li', {
    className: `trip-item ${trip.completed ? 'completed' : ''}`,
    dataset: { id: idx },
  });
  const name = escapeHTML(trip.name || '—');
  const city = escapeHTML(trip.city || '—');
  const currentCity = escapeHTML(trip.currentCity || '—');
  const desc = formatDesc(trip.desc);

  const view = createElement('div', { className: 'trip-view' });
  view.append(
    createElement('h3', {}, name),
    createElement(
      'p',
      {},
      createElement('strong', {}, getTranslation('destinationLabel') + ': '),
      city
    ),
    createElement('pre', { className: 'trip-desc' }, desc),
    trip.photo
      ? createElement('img', {
          src: trip.photo,
          className: 'trip-photo',
          alt: getTranslation('tripPhotoAlt'),
          loading: 'lazy',
        })
      : createElement(
          'div',
          {
            className: 'trip-photo-placeholder',
          },
          getTranslation('noPhotoPlaceholder')
        ),
    createElement(
      'p',
      {},
      createElement(
        'strong',
        {},
        getTranslation('currentLocationDisplay') + ': '
      ),
      currentCity
    ),
    createElement(
      'label',
      { className: 'checkbox-label' },
      createElement('input', {
        type: 'checkbox',
        dataset: { index: idx },
        checked: trip.completed,
      }),
      getTranslation('markAsVisited')
    ),
    createElement(
      'div',
      { className: 'trip-actions' },
      createElement(
        'button',
        { className: 'btn-edit', dataset: { action: 'edit', index: idx } },
        getTranslation('editButton')
      ),
      createElement(
        'button',
        { className: 'btn-delete', dataset: { action: 'delete', index: idx } },
        getTranslation('deleteButton')
      )
    )
  );

  // Edycja
  const edit = createElement('div', {
    className: 'trip-edit card',
    style: { display: 'none' },
  });
  const form = createElement('form', {
    className: 'edit-form',
    dataset: { id: idx },
  });

  form.append(
    createElement(
      'div',
      { className: 'setting-item' },
      createElement('label', {}, getTranslation('tripNamePlaceholder')),
      createElement('input', {
        type: 'text',
        className: 'edit-name',
        value: trip.name || '',
        placeholder: getTranslation('tripNamePlaceholder'),
        required: true,
      })
    ),
    createElement(
      'div',
      { className: 'setting-item' },
      createElement('label', {}, getTranslation('tripCityPlaceholder')),
      createElement('input', {
        type: 'text',
        className: 'edit-city',
        value: trip.city || '',
        placeholder: getTranslation('tripCityPlaceholder'),
        required: true,
      })
    ),
    createElement(
      'div',
      { className: 'setting-item' },
      createElement('label', {}, getTranslation('tripDescPlaceholder')),
      createElement(
        'textarea',
        {
          className: 'edit-desc',
          placeholder: getTranslation('tripDescPlaceholder'),
          required: true,
        },
        trip.desc || ''
      )
    ),
    createElement(
      'div',
      {
        className: 'photo-preview-container',
        style: { display: 'none', margin: '15px 0', textAlign: 'center' },
      },
      createElement('img', {
        className: 'edit-photo-preview',
        style: { maxWidth: '100%', borderRadius: '8px' },
      })
    ),
    createElement(
      'div',
      { className: 'photo-section' },
      createElement(
        'button',
        { type: 'button', className: 'photo-btn' },
        getTranslation('photoFromCamera')
      )
    ),
    createElement('input', {
      type: 'file',
      className: 'edit-photo-input',
      accept: 'image/*',
      style: { display: 'none' },
    }),
    createElement(
      'div',
      { className: 'edit-actions' },
      createElement(
        'button',
        { type: 'submit', className: 'btn-save' },
        getTranslation('saveTripButton')
      ),
      createElement(
        'button',
        { type: 'button', className: 'btn-cancel' },
        getTranslation('cancelButton')
      )
    )
  );

  edit.appendChild(form);
  li.append(view, edit);
  return li;
}

// Render wszystkich podróży
function renderTrips() {
  tripList.replaceChildren();
  if (trips.length === 0) {
    tripList.appendChild(
      createElement(
        'p',
        { className: 'no-trips' },
        getTranslation('noTrips') || 'Brak podróży. Dodaj pierwszą!'
      )
    );
    return;
  }
  const fragment = document.createDocumentFragment();
  trips
    .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    .forEach((trip, idx) => fragment.appendChild(createTripItem(trip, idx)));
  tripList.appendChild(fragment);
}

// Obsługa zdarzeń
function handleCheckboxChange(idx, checked) {
  trips[idx].completed = checked;
  saveTrips();
  renderTrips();
}

function handlePhotoChange(input) {
  const file = input.files?.[0];
  if (!file) return;
  const li = input.closest('li');
  currentEditForm = li.querySelector('.edit-form');
  const container = currentEditForm.querySelector('.photo-preview-container');
  const img = container.querySelector('.edit-photo-preview');
  const reader = new FileReader();
  reader.onload = ev => {
    pendingPhoto = ev.target.result;
    img.src = pendingPhoto;
    container.style.display = 'block';
  };
  reader.onerror = () => showToast('Error reading photo', 3000);
  reader.readAsDataURL(file);
}

tripList.addEventListener('change', e => {
  if (e.target.matches('input[type="checkbox"]'))
    handleCheckboxChange(+e.target.dataset.index, e.target.checked);
  if (e.target.matches('.edit-photo-input')) handlePhotoChange(e.target);
});

tripList.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
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
    showToast(
      getTranslation('confirmDelete') ||
        'Czy na pewno chcesz usunąć tę podróż?',
      8000,
      () => {
        trips.splice(idx, 1);
        saveTrips();
        renderTrips();
      }
    );
    return;
  }

  if (btn.classList.contains('photo-btn'))
    li.querySelector('.edit-photo-input').click();
  if (btn.classList.contains('btn-cancel')) {
    pendingPhoto = null;
    renderTrips();
  }
});

// Submit formularza edycji
tripList.addEventListener('submit', e => {
  if (!e.target.matches('.edit-form')) return;
  e.preventDefault();
  const idx = +e.target.dataset.id;
  const form = e.target;
  const name = form.querySelector('.edit-name')?.value.trim();
  const city = form.querySelector('.edit-city')?.value.trim();
  const desc = form.querySelector('.edit-desc')?.value.trim();

  if (!name || !city || !desc) {
    showToast('Wszystkie pola są wymagane', 3000);
    return;
  }

  trips[idx] = {
    ...trips[idx],
    name,
    city,
    desc,
    photo: pendingPhoto || trips[idx].photo,
  };
  pendingPhoto = null;
  saveTrips();
  renderTrips();
});

// UI i tłumaczenia
function updateUI() {
  document.querySelector('header h1').textContent =
    getTranslation('dashboardTitle');
  document.querySelector('main h2').textContent = getTranslation('yourTrips');
  renderTrips();
  updateNavUI();
}

window.addEventListener('load', updateUI);
document.addEventListener('languageChange', updateUI);
window.addEventListener('online', updateUI);
window.addEventListener('offline', updateUI);

//  cleanup listenerów
window.addEventListener('beforeunload', () => {
  tripList.replaceChildren();
});
