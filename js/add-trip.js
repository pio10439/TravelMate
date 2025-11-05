let currentCityAtAdd = '';
let selectedPhoto = '';

function compressImage(file, maxWidth = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = e => {
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = img.width / img.height;

      // ograniczamy szerokość do maxWidth, zachowując proporcje
      const width = Math.min(maxWidth, img.width);
      const height = width / ratio;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // zmniejszamy jakość JPG (0.7 = 70%)
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };

    img.onerror = reject;
  });
}

window.addEventListener('load', () => {
  const getLocationBtn = document.getElementById('get-location');
  const locationDisplay = document.getElementById('current-location-display');
  const tripForm = document.getElementById('trip-form');
  const photoPreview = document.getElementById('photo-preview');

  // === PRZYCISKI ===
  document.getElementById('from-camera').onclick = () =>
    document.getElementById('camera-input').click();
  document.getElementById('from-gallery').onclick = () =>
    document.getElementById('gallery-input').click();

  ['camera-input', 'gallery-input'].forEach(id => {
    document.getElementById(id).onchange = e => {
      const file = e.target.files[0];
      if (!file) return;

      compressImage(file, 800, 0.6).then(base64 => {
        selectedPhoto = base64;
        photoPreview.src = base64;
        photoPreview.style.display = 'block';
      });
    };
  });

  getLocationBtn.onclick = () => {
    if (!navigator.geolocation) {
      alert(getTranslation('geolocationNotSupported', translations));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();

          currentCityAtAdd =
            data.address?.city || data.address?.town || 'Unknown';

          // użyj tłumaczenia zamiast sztywnego tekstu
          const baseText = getTranslation(
            'currentLocationDisplay',
            translations
          );
          locationDisplay.textContent = `${baseText} ${currentCityAtAdd}`;
        } catch {
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

  // === ZAPIS ===
  tripForm.onsubmit = e => {
    e.preventDefault();

    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.push({
      name: document.getElementById('trip-name').value.trim(),
      city: document.getElementById('trip-city').value.trim(),
      desc: document.getElementById('trip-desc').value.trim(),
      photo: selectedPhoto,
      currentCity: currentCityAtAdd,
      completed: false,
    });

    try {
      localStorage.setItem('trips', JSON.stringify(trips));
      alert(getTranslation('tripSaved', translations));
      location.href = 'index.html';
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        alert(getTranslation('storageFullError', translations));
      } else {
        console.error('Błąd zapisu podróży:', err);
        alert(getTranslation('storageSaveError', translations));
      }
    }
  };

  // === UI + TŁUMACZENIA ===
  const updateUI = () => {
    document.querySelector('header h1').textContent = getTranslation(
      'addTripTitle',
      translations
    );
    document.getElementById('trip-name').placeholder = getTranslation(
      'tripNamePlaceholder',
      translations
    );
    document.getElementById('trip-city').placeholder = getTranslation(
      'tripCityPlaceholder',
      translations
    );
    document.getElementById('trip-desc').placeholder = getTranslation(
      'tripDescPlaceholder',
      translations
    );
    getLocationBtn.textContent = getTranslation(
      'getLocationButton',
      translations
    );
    locationDisplay.textContent = getTranslation(
      'currentLocationDisplay',
      translations
    );
    tripForm.querySelector("button[type='submit']").textContent =
      getTranslation('saveTripButton', translations);

    document.getElementById('from-camera').textContent =
      getTranslation('photoFromCamera', translations) || 'Zrób zdjęcie';
    document.getElementById('from-gallery').textContent =
      getTranslation('photoFromGallery', translations) || 'Wybierz z galerii';

    updateNavUI();
  };

  updateUI();
  document.addEventListener('languageChange', updateUI);
});
