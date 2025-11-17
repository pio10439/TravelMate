let currentCityAtAdd = '';
let selectedPhoto = '';

// Kompresja do 800px i jakości 0.7
function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => (img.src = e.target.result);
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;
      const width = Math.min(maxWidth, img.width);
      const height = width / ratio;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Image load error'));
  });
}

// Debounce helper
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Walidacja formularza
function validateTripForm(name, city, desc) {
  if (!name) return 'Trip name is required';
  if (!city) return 'City is required';
  if (!desc) return 'Description is required';
  return null;
}

window.addEventListener('load', () => {
  const getLocationBtn = document.getElementById('get-location');
  const locationDisplay = document.getElementById('current-location-display');
  const tripForm = document.getElementById('trip-form');
  const photoPreview = document.getElementById('photo-preview');
  const addPhotoBtn = document.getElementById('add-photo');

  if (!getLocationBtn || !tripForm || !addPhotoBtn || !locationDisplay) return;

  // Jeden input do zdjęć
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const handleFileChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file, 800, 0.6);
      selectedPhoto = base64;
      photoPreview.src = base64;
      photoPreview.style.display = 'block';
    } catch (err) {
      console.error('Image compression error:', err);
      showToast('Error compressing image', 3000);
    }
  };

  const handleAddPhotoClick = () => fileInput.click();

  addPhotoBtn.addEventListener('click', handleAddPhotoClick);
  fileInput.addEventListener('change', handleFileChange);

  // Pobranie lokalizacji z throttlingiem
  const fetchLocation = async () => {
    if (!navigator.geolocation) {
      showToast(getTranslation('geolocationNotSupported', translations), 3000);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          if (!res.ok) throw new Error('Network response was not ok');
          const data = await res.json();
          currentCityAtAdd =
            data.address?.city || data.address?.town || 'Unknown';
          const baseText = getTranslation(
            'currentLocationDisplay',
            translations
          );
          locationDisplay.textContent = `${baseText} ${currentCityAtAdd}`;
        } catch (err) {
          console.error('Location fetch error:', err);
          locationDisplay.textContent = getTranslation(
            'locationFetchError',
            translations
          );
        }
      },
      () => {
        locationDisplay.textContent = getTranslation(
          'locationAccessDenied',
          translations
        );
      }
    );
  };

  getLocationBtn.addEventListener('click', debounce(fetchLocation, 500));

  // Dodanie podróży
  tripForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('trip-name')?.value.trim();
    const city = document.getElementById('trip-city')?.value.trim();
    const desc = document.getElementById('trip-desc')?.value.trim();

    const validationError = validateTripForm(name, city, desc);
    if (validationError) {
      showToast(validationError, 3000);
      return;
    }

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.unshift({
      name,
      city,
      desc,
      photo: selectedPhoto,
      currentCity: currentCityAtAdd,
      completed: false,
    });

    try {
      localStorage.setItem('trips', JSON.stringify(trips));
      showToast(getTranslation('tripSaved', translations), 2000);
      setTimeout(() => (location.href = 'index.html'), 800);
    } catch (err) {
      console.error('LocalStorage error:', err);
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        showToast(getTranslation('storageFullError', translations), 5000);
      } else {
        showToast(getTranslation('storageSaveError', translations), 3000);
      }
    }
  });

  // Aktualizacja UI / tłumaczenia
  const updateUI = () => {
    document.querySelector('header h1').textContent = getTranslation(
      'addTripTitle',
      translations
    );

    document.querySelector("label[for='trip-name']").textContent =
      getTranslation('tripNameLabel', translations);
    document.querySelector("label[for='trip-city']").textContent =
      getTranslation('tripCityLabel', translations);
    document.querySelector("label[for='trip-desc']").textContent =
      getTranslation('tripDescLabel', translations);

    const formTitle = document.getElementById('trip-form-title');
    if (formTitle)
      formTitle.textContent = getTranslation('addTripTitle', translations);

    const tripNameInput = document.getElementById('trip-name');
    if (tripNameInput)
      tripNameInput.placeholder = getTranslation(
        'tripNamePlaceholder',
        translations
      );

    const tripCityInput = document.getElementById('trip-city');
    if (tripCityInput)
      tripCityInput.placeholder = getTranslation(
        'tripCityPlaceholder',
        translations
      );

    const tripDescInput = document.getElementById('trip-desc');
    if (tripDescInput)
      tripDescInput.placeholder = getTranslation(
        'tripDescPlaceholder',
        translations
      );

    getLocationBtn.textContent = getTranslation(
      'getLocationButton',
      translations
    );
    addPhotoBtn.textContent =
      getTranslation('photoFromCamera', translations) || 'Add Photo';
    tripForm.querySelector("button[type='submit']").textContent =
      getTranslation('saveTripButton', translations);

    locationDisplay.textContent = getTranslation(
      'currentLocationDisplay',
      translations
    );

    updateNavUI();
  };

  updateUI();
  document.addEventListener('languageChange', updateUI);

  window.addEventListener('beforeunload', () => {
    addPhotoBtn.removeEventListener('click', handleAddPhotoClick);
    fileInput.removeEventListener('change', handleFileChange);
    getLocationBtn.removeEventListener('click', debounce(fetchLocation, 500));
    document.removeEventListener('languageChange', updateUI);
  });
});
