const apiKey = document.querySelector('meta[name="weather-api-key"]')?.content;
if (!apiKey) console.warn('No API key in <meta>!');

const weatherDisplay = document.getElementById('weather-display');
const hintContainer = document.getElementById('offline-weather-hint');
const hintText = document.getElementById('hint-text');
const cityInput = document.getElementById('city-input');

// Toast
function showToast(message) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.remove(), 3000);
}

// Dobór klasy animacji pogody
function getWeatherClass(condition) {
  if (!condition) return '';
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return 'sunny';
  if (c.includes('cloud') || c.includes('overcast')) return 'cloudy';
  if (c.includes('rain')) return 'rainy';
  return '';
}

// UI tłumaczenia
function updateWeatherUI() {
  try {
    const title = document.querySelector('header h1');
    if (title) title.textContent = getTranslation('weatherTitle');

    const btnLoc = document.getElementById('get-location');
    if (btnLoc) btnLoc.textContent = getTranslation('getLocationButton');

    const btnCity = document.getElementById('get-city');
    if (btnCity) btnCity.textContent = getTranslation('getWeatherButton');

    if (cityInput)
      cityInput.placeholder = getTranslation('cityInputPlaceholder');
    const cityLabel = document.querySelector(
      'label[data-i18n="cityInputLabel"]'
    );
    if (cityLabel) cityLabel.textContent = getTranslation('cityInputLabel');
  } catch (e) {
    console.error('updateWeatherUI error:', e);
  }
}

function updateHint() {
  try {
    const last = localStorage.getItem('lastWeather');
    if (!last || navigator.onLine === true) {
      hintContainer.style.display = 'none';
      return;
    }

    const data = JSON.parse(last);
    const time = data.current?.last_updated || data.location?.localtime;
    if (!time) return (hintContainer.style.display = 'none');

    const formatted = new Date(time).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    hintContainer.style.display = 'block';
    hintText.textContent = `${getTranslation('lastWeather')}: ${formatted}`;
  } catch (e) {
    hintContainer.style.display = 'none';
  }
}

function renderWeather(data) {
  weatherDisplay.replaceChildren();

  const fragment = document.createDocumentFragment();

  const title = document.createElement('h2');
  title.textContent = `${data.location.name}, ${data.location.country}`;
  fragment.appendChild(title);

  const cond = document.createElement('p');
  cond.className = 'condition';
  cond.textContent = `${getTranslation('conditionLabel')}: ${
    data.current.condition.text
  }`;
  fragment.appendChild(cond);

  const iconWrap = document.createElement('div');
  iconWrap.className = 'weather-icon-wrapper';
  const img = document.createElement('img');
  img.src = 'https:' + data.current.condition.icon;
  img.alt = 'weather icon';
  img.className = 'weather-icon';
  iconWrap.appendChild(img);
  fragment.appendChild(iconWrap);

  const unit = localStorage.getItem('tempUnit') || 'celsius';
  const t = unit === 'fahrenheit' ? data.current.temp_f : data.current.temp_c;
  const feels =
    unit === 'fahrenheit' ? data.current.feelslike_f : data.current.feelslike_c;
  const sym = unit === 'fahrenheit' ? '°F' : '°C';

  const temp = document.createElement('p');
  temp.textContent = `${getTranslation(
    'temperatureLabel'
  )}: ${t} ${sym} (${getTranslation('feelsLikeLabel')}: ${feels} ${sym})`;
  fragment.appendChild(temp);

  const hum = document.createElement('p');
  hum.textContent = `${getTranslation('humidityLabel')}: ${
    data.current.humidity
  }%`;
  fragment.appendChild(hum);

  const wind = document.createElement('p');
  wind.textContent = `${getTranslation('windLabel')}: ${
    data.current.wind_kph
  } ${getTranslation('kphUnit')}`;
  fragment.appendChild(wind);

  const uv = document.createElement('p');
  uv.textContent = `${getTranslation('uvIndexLabel')}: ${data.current.uv}`;
  fragment.appendChild(uv);

  weatherDisplay.appendChild(fragment);

  const cls = getWeatherClass(data.current.condition.text);
  weatherDisplay.className = cls;
}

function showWeather(data) {
  try {
    if (data.error) {
      weatherDisplay.textContent = getTranslation('cityNotFound');
      updateHint();
      return;
    }

    renderWeather(data);
    localStorage.setItem('lastWeather', JSON.stringify(data));
    updateHint();
  } catch (e) {
    console.error('showWeather error:', e);
  }
}

async function fetchWeather(url) {
  try {
    const r = await fetch(url);
    const data = await r.json();
    showWeather(data);
  } catch (e) {
    console.warn('Fetch error – using cache:', e);
    const last = localStorage.getItem('lastWeather');
    if (last) showWeather(JSON.parse(last));
  }
}

function fetchWeatherByCity(city) {
  if (!city || city.length < 2) {
    showToast(getTranslation('errorNoCity'));
    return;
  }
  fetchWeather(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
      city
    )}&aqi=no`
  );
}

function fetchWeatherByCoords(lat, lon) {
  fetchWeather(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lon}&aqi=no`
  );
}

function debounce(fn, delay = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

const debouncedCityFetch = debounce(() => {
  const city = cityInput.value.trim();
  fetchWeatherByCity(city);
});

function refreshAll() {
  try {
    const last = localStorage.getItem('lastWeather');
    if (last) showWeather(JSON.parse(last));
  } catch {}

  updateWeatherUI();
  updateNavUI();
  updateHint();
}

function initListeners() {
  const onLoad = refreshAll;
  const onOnline = refreshAll;
  const onOffline = refreshAll;
  const onLang = refreshAll;

  const btnLoc = document.getElementById('get-location');
  const btnCity = document.getElementById('get-city');

  const onLocClick = () => {
    if (!navigator.geolocation)
      return showToast(getTranslation('errorNoGeolocation'));

    navigator.geolocation.getCurrentPosition(
      pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => showToast(getTranslation('errorNoLocation'))
    );
  };

  const onCityClick = debouncedCityFetch;

  window.addEventListener('load', onLoad);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  document.addEventListener('languageChange', onLang);
  btnLoc?.addEventListener('click', onLocClick);
  btnCity?.addEventListener('click', onCityClick);

  window.addEventListener('beforeunload', () => {
    window.removeEventListener('load', onLoad);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
    document.removeEventListener('languageChange', onLang);
    btnLoc?.removeEventListener('click', onLocClick);
    btnCity?.removeEventListener('click', onCityClick);
  });
}

initListeners();
