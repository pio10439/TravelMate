const toggleThemeBtn = document.getElementById('toggle-theme');
const notifToggleBtn = document.getElementById('notif-toggle');
const languageSelect = document.getElementById('language-select');
const tempUnitRadios = document.getElementsByName('temp-unit');
const notifFreqRadios = document.getElementsByName('notif-freq');
const toast = document.getElementById('toast');

let notifInterval = null;

const __cleanupListeners = [];
function addListener(target, event, handler, options) {
  if (!target || typeof target.addEventListener !== 'function') return;
  target.addEventListener(event, handler, options);
  __cleanupListeners.push(() => {
    try {
      target.removeEventListener(event, handler, options);
    } catch (e) {}
  });
}
window.addEventListener('beforeunload', () =>
  __cleanupListeners.forEach(fn => fn())
);

function debounce(fn, delay = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// Tlumaczenia
function updateSettingsUI() {
  document.querySelector('header h1').textContent = getTranslation(
    'settingsTitle',
    translations
  );
  document.querySelector('.appearance-title').textContent = getTranslation(
    'appearanceSection',
    translations
  );
  document.querySelector('.theme-label').textContent = getTranslation(
    'themeLabel',
    translations
  );
  toggleThemeBtn.textContent = getTranslation('toggleTheme', translations);
  document.querySelector('.preferences-title').textContent = getTranslation(
    'preferencesSection',
    translations
  );
  document.querySelector('.language-label').textContent = getTranslation(
    'languageLabel',
    translations
  );
  languageSelect.options[0].text = getTranslation(
    'languageEnglish',
    translations
  );
  languageSelect.options[1].text = getTranslation(
    'languagePolish',
    translations
  );
  document.querySelector('.temp-unit-label').textContent = getTranslation(
    'tempUnitLabel',
    translations
  );
  document.querySelector("label[for='celsius'] .temp-unit-text").textContent =
    getTranslation('celsius', translations);
  document.querySelector(
    "label[for='fahrenheit'] .temp-unit-text"
  ).textContent = getTranslation('fahrenheit', translations);
  document.querySelector('.notifications-title').textContent = getTranslation(
    'notificationsSection',
    translations
  );
  document.querySelector('.notif-status-label').textContent = getTranslation(
    'notifStatusLabel',
    translations
  );
  notifToggleBtn.textContent =
    localStorage.getItem('notificationsEnabled') === 'true'
      ? getTranslation('disableNotifications', translations)
      : getTranslation('enableNotifications', translations);
  document.querySelector('.notif-freq-label').textContent = getTranslation(
    'notifFreqLabel',
    translations
  );
  document.querySelector(
    "label[for='notif-off'] .notif-freq-text"
  ).textContent = getTranslation('notifOff', translations);
  document.querySelector(
    "label[for='notif-daily'] .notif-freq-text"
  ).textContent = getTranslation('notifDaily', translations);
  document.querySelector(
    "label[for='notif-weekly'] .notif-freq-text"
  ).textContent = getTranslation('notifWeekly', translations);
}
// Zmiana trybu jasny/ciemny
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  try {
    localStorage.setItem('darkTheme', isDark);
  } catch (e) {
    console.warn('Could not write darkTheme to localStorage', e);
  }
  const mode = isDark
    ? getTranslation('dark', translations)
    : getTranslation('light', translations);
  showToast(
    getTranslation('toastThemeSwitched', translations).replace('{mode}', mode)
  );
});
// Zmiana jezyka PL/EN
languageSelect.addEventListener(
  'change',
  debounce(() => {
    if (!languageSelect) return;
    const language = languageSelect.value;
    try {
      localStorage.setItem('language', language);
    } catch (e) {
      console.warn('Could not save language', e);
    }
    updateSettingsUI();
    updateNavUI();
    showToast(
      getTranslation('toastLanguageSet', translations).replace(
        '{language}',
        getTranslation(`language${language}`, translations)
      )
    );
    document.dispatchEvent(new CustomEvent('languageChange'));
  }, 200)
);
// Zmiana jednostek temp
tempUnitRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const unit = radio.value;
    try {
      localStorage.setItem('tempUnit', unit);
    } catch (e) {
      console.warn('Could not save tempUnit', e);
    }
    showToast(
      getTranslation('toastTempUnitSet', translations).replace(
        '{unit}',
        getTranslation(unit, translations)
      )
    );
  });
});
// Zmiana czestotliwosci powiadomien
notifFreqRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const freq = radio.value;
    try {
      localStorage.setItem('notificationFrequency', freq);
    } catch (e) {
      console.warn('Could not save notificationFrequency', e);
    }
    updateNotifications();
    showToast(
      getTranslation('toastNotifFreqSet', translations).replace(
        '{freq}',
        getTranslation(
          `notif${freq.charAt(0).toUpperCase() + freq.slice(1)}`,
          translations
        )
      )
    );
  });
});

window.addEventListener('load', () => {
  try {
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) document.body.classList.add('dark-theme');

    const notifEnabled =
      localStorage.getItem('notificationsEnabled') === 'true';
    updateNotifButton(notifEnabled);
    if (notifEnabled) updateNotifications();

    const language = localStorage.getItem('language') || 'English';
    languageSelect.value = language;

    const tempUnit = localStorage.getItem('tempUnit') || 'celsius';
    document.querySelector(
      `input[name="temp-unit"][value="${tempUnit}"]`
    ).checked = true;

    const notifFreq = localStorage.getItem('notificationFrequency') || 'off';
    document.querySelector(
      `input[name="notif-freq"][value="${notifFreq}"]`
    ).checked = true;

    updateSettingsUI();
    updateNavUI();
  } catch (e) {
    console.error('Error during load', e);
    showToast(getTranslation('toastLoadError', translations));
  }
});
// Wlacz/wylacz powiadomienia
notifToggleBtn.addEventListener('click', async () => {
  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';

  if (!notifEnabled) {
    if (!('Notification' in window)) {
      return showToast(
        getTranslation('toastNotifPermissionDenied', translations)
      );
    }
    // Pozwolenia na powiadomienia
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('notificationsEnabled', 'true');
        updateNotifButton(true);
        updateNotifications();
        showToast(getTranslation('toastNotifEnabled', translations));
      } else {
        showToast(getTranslation('toastNotifPermissionDenied', translations));
      }
    } catch (e) {
      console.error('Notification permission error', e);
      showToast(getTranslation('toastNotifPermissionDenied', translations));
    }
  } else {
    try {
      localStorage.setItem('notificationsEnabled', 'false');
    } catch (e) {}
    updateNotifButton(false);
    stopNotifications();
    showToast(getTranslation('toastNotifDisabled', translations));
  }
});
// Interwal powiadomien
function updateNotifications() {
  stopNotifications();
  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (!notifEnabled) return;

  const freq = localStorage.getItem('notificationFrequency') || 'off';
  let interval = null;
  if (freq === 'off') {
    notifInterval = null;
    return;
  }
  if (freq === 'daily') {
    interval = 10 * 1000; // dla test co 10s normalnie 24 * 60 * 60 * 1000;
  } else if (freq === 'weekly') {
    interval = 7 * 24 * 60 * 60 * 1000;
  }

  if (interval) notifInterval = setInterval(sendDailyNotification, interval);
}
// zatrzymanie powiadomien
function stopNotifications() {
  if (notifInterval) clearInterval(notifInterval);
  notifInterval = null;
}
// Wysyla powiadomienia
function sendDailyNotification() {
  try {
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.showNotification(
            getTranslation('notificationTitle', translations),
            {
              body: getTranslation('notificationBody', translations),
              icon: 'images/business-trip.png',
            }
          );
        })
        .catch(err => console.error('serviceWorker.ready error:', err));
    }
  } catch (e) {
    console.error('sendDailyNotification error:', e);
  }
}

function updateNotifButton(isEnabled) {
  notifToggleBtn.textContent = isEnabled
    ? getTranslation('disableNotifications', translations)
    : getTranslation('enableNotifications', translations);
}
// Komunikat
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
