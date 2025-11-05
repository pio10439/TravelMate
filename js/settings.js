const toggleThemeBtn = document.getElementById('toggle-theme');
const notifToggleBtn = document.getElementById('notif-toggle');
const languageSelect = document.getElementById('language-select');
const tempUnitRadios = document.getElementsByName('temp-unit');
const notifFreqRadios = document.getElementsByName('notif-freq');
const toast = document.getElementById('toast');

let notifInterval = null;

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

toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', isDark);
  const mode = isDark
    ? getTranslation('dark', translations)
    : getTranslation('light', translations);
  showToast(
    getTranslation('toastThemeSwitched', translations).replace('{mode}', mode)
  );
});

languageSelect.addEventListener('change', () => {
  const language = languageSelect.value;
  localStorage.setItem('language', language);
  updateSettingsUI();
  updateNavUI();
  showToast(
    getTranslation('toastLanguageSet', translations).replace(
      '{language}',
      getTranslation(`language${language}`, translations)
    )
  );
  document.dispatchEvent(new CustomEvent('languageChange'));
});

tempUnitRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const unit = radio.value;
    localStorage.setItem('tempUnit', unit);
    showToast(
      getTranslation('toastTempUnitSet', translations).replace(
        '{unit}',
        getTranslation(unit, translations)
      )
    );
  });
});

notifFreqRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const freq = radio.value;
    localStorage.setItem('notificationFrequency', freq);
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
  const isDark = localStorage.getItem('darkTheme') === 'true';
  if (isDark) document.body.classList.add('dark-theme');

  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';
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
});

notifToggleBtn.addEventListener('click', async () => {
  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';

  if (!notifEnabled) {
    if (!('Notification' in window)) {
      return alert(getTranslation('toastNotifPermissionDenied', translations));
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('notificationsEnabled', 'true');
      updateNotifButton(true);
      updateNotifications();
      showToast(getTranslation('toastNotifEnabled', translations));
    } else {
      showToast(getTranslation('toastNotifPermissionDenied', translations));
    }
  } else {
    localStorage.setItem('notificationsEnabled', 'false');
    updateNotifButton(false);
    stopNotifications();
    showToast(getTranslation('toastNotifDisabled', translations));
  }
});

function updateNotifications() {
  stopNotifications();
  const notifEnabled = localStorage.getItem('notificationsEnabled') === 'true';
  if (!notifEnabled) return;

  const freq = localStorage.getItem('notificationFrequency') || 'off';
  let interval = null;

  if (freq === 'daily') {
    interval = 24 * 60 * 60 * 1000;
  } else if (freq === 'weekly') {
    interval = 7 * 24 * 60 * 60 * 1000;
  }

  if (interval) notifInterval = setInterval(sendDailyNotification, interval);
}

function stopNotifications() {
  if (notifInterval) clearInterval(notifInterval);
}

function sendDailyNotification() {
  if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(
        getTranslation('notificationTitle', translations),
        {
          body: getTranslation('notificationBody', translations),
          icon: 'images/business-trip.png',
        }
      );
    });
  }
}

function updateNotifButton(isEnabled) {
  notifToggleBtn.textContent = isEnabled
    ? getTranslation('disableNotifications', translations)
    : getTranslation('enableNotifications', translations);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
