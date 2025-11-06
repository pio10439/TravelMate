let currentCityAtAdd = '';
let selectedPhoto = '';
//Kompresja do 800px i jakosci 0.7
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

      const width = Math.min(maxWidth, img.width);
      const height = width / ratio;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

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
  const addPhotoBtn = document.getElementById('add-photo');
  // Jeden input do zrobienia i zdjecia i dodania z galerii
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  addPhotoBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.6).then(base64 => {
      selectedPhoto = base64;
      photoPreview.src = base64;
      photoPreview.style.display = 'block';
    });
  });
  // Pobranie lokalizacji
  getLocationBtn.onclick = () => {
    if (!navigator.geolocation) {
      showToast(getTranslation('geolocationNotSupported', translations), 3000);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json` // zamiana wspolrzednych na nazwe miasta w obecnej lokalizacji
          );
          const data = await res.json();

          currentCityAtAdd =
            data.address?.city || data.address?.town || 'Unknown';

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
  // Dodanie nowego obiektu podrozy to trips
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
    // Obsluga bledu po zapchaniu pamieci
    try {
      localStorage.setItem('trips', JSON.stringify(trips));
      showToast(getTranslation('tripSaved', translations), 2000);
      setTimeout(() => {
        location.href = 'index.html';
      }, 800);
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        showToast(getTranslation('storageFullError', translations), 5000);
      } else {
        console.error('Błąd zapisu podróży:', err);
        showToast(getTranslation('storageSaveError', translations), 3000);
      }
    }
  };
  // Tlumaczenie
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

    addPhotoBtn.textContent =
      getTranslation('photoFromCamera', translations) || 'Dodaj zdjęcie';

    updateNavUI();
  };

  updateUI();
  document.addEventListener('languageChange', updateUI); // Aktualizacja po zmienie jezyka w ustawieniach
});
