const apiKey = '89f7ee0e098f472e88492420252310';
const weatherDisplay = document.getElementById('weather-display');
const hintContainer = document.getElementById('offline-weather-hint');
const hintText = document.getElementById('hint-text');
const cityInput = document.getElementById('city-input');

// === 1. FUNKCJE NA GÓRZE ===
function getWeatherClass(condition) {
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return 'sunny';
  if (c.includes('cloud') || c.includes('overcast')) return 'cloudy';
  if (c.includes('rain') || c.includes('shower') || c.includes('storm'))
    return 'rainy';
  return '';
}

function updateWeatherUI() {
  document.querySelector('header h1').textContent = getTranslation(
    'weatherTitle',
    translations
  );
  document.getElementById('get-location').textContent = getTranslation(
    'getLocationButton',
    translations
  );
  document.getElementById('get-city').textContent = getTranslation(
    'getWeatherButton',
    translations
  );
  cityInput.placeholder = getTranslation('cityInputPlaceholder', translations);
}

function updateHint() {
  const last = localStorage.getItem('lastWeather');
  if (!last || navigator.onLine) {
    hintContainer.style.display = 'none';
    return;
  }

  try {
    const data = JSON.parse(last);
    const time = data.current?.last_updated || data.location?.localtime;
    if (!time) return (hintContainer.style.display = 'none');

    const date = new Date(time);
    const formatted = date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    hintContainer.style.display = 'block';
    hintText.textContent = `${getTranslation(
      'lastWeather',
      translations
    )}: ${formatted}`;
  } catch (e) {
    hintContainer.style.display = 'none';
  }
}

function showWeather(data) {
  weatherDisplay.className = '';
  if (data.error) {
    weatherDisplay.classList.add('error');
    weatherDisplay.innerHTML = `<p class="error-message">${getTranslation(
      'cityNotFound',
      translations
    )}</p>`;
    updateHint();
    return;
  }

  const c = data.current;
  const l = data.location;
  const iconUrl = 'https:' + c.condition.icon;
  const cls = getWeatherClass(c.condition.text);
  const unit = localStorage.getItem('tempUnit') || 'celsius';
  const temp = unit === 'fahrenheit' ? c.temp_f : c.temp_c;
  const feels = unit === 'fahrenheit' ? c.feelslike_f : c.feelslike_c;
  const sym = unit === 'fahrenheit' ? '°F' : '°C';

  weatherDisplay.classList.add(cls);
  weatherDisplay.innerHTML = `
    <h2>${l.name}, ${l.country}</h2>
    <p class="condition">${getTranslation('conditionLabel', translations)}: ${
    c.condition.text
  }</p>
    <div class="weather-icon-wrapper">
      <img src="${iconUrl}" alt="weather icon" class="weather-icon">
    </div>
    <p>${getTranslation('temperatureLabel', translations)}: ${temp} ${sym}
       (${getTranslation('feelsLikeLabel', translations)}: ${feels} ${sym})</p>
    <p>${getTranslation('humidityLabel', translations)}: ${c.humidity}%</p>
    <p>${getTranslation('windLabel', translations)}: ${
    c.wind_kph
  } ${getTranslation('kphUnit', translations)}</p>
    <p>${getTranslation('uvIndexLabel', translations)}: ${c.uv}</p>
  `;

  localStorage.setItem('lastWeather', JSON.stringify(data));
  updateHint();
}

// === 2. FETCH ===
function fetchWeatherByCity(city) {
  fetch(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`
  )
    .then(r => r.json())
    .then(showWeather)
    .catch(() => {
      const last = localStorage.getItem('lastWeather');
      if (last) showWeather(JSON.parse(last));
    });
}

function fetchWeatherByCoords(lat, lon) {
  fetch(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
  )
    .then(r => r.json())
    .then(showWeather)
    .catch(() => {
      const last = localStorage.getItem('lastWeather');
      if (last) showWeather(JSON.parse(last));
    });
}

// === 3. ODŚWIEŻANIE ===
function refreshAll() {
  const last = localStorage.getItem('lastWeather');
  if (last) showWeather(JSON.parse(last));
  updateWeatherUI();
  updateNavUI();
  updateHint();
}

// === 4. EVENTY ===
window.addEventListener('load', refreshAll);
document.addEventListener('languageChange', refreshAll);
window.addEventListener('online', () => {
  hintContainer.style.display = 'none';
  refreshAll();
});
window.addEventListener('offline', refreshAll);

document.getElementById('get-location').addEventListener('click', () => {
  if (!navigator.geolocation)
    return alert(getTranslation('errorNoGeolocation', translations));
  navigator.geolocation.getCurrentPosition(
    p => fetchWeatherByCoords(p.coords.latitude, p.coords.longitude),
    () => alert(getTranslation('errorNoLocation', translations))
  );
});

document.getElementById('get-city').addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) return alert(getTranslation('errorNoCity', translations));
  fetchWeatherByCity(city);
});
