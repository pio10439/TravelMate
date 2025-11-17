function getTranslation(key, translationsObj = translations) {
  if (typeof key !== 'string' || !translationsObj) return key;

  try {
    const language = (() => {
      try {
        return localStorage.getItem('language') || 'English';
      } catch (e) {
        console.warn('Could not read language from localStorage', e);
        return 'English';
      }
    })();

    return (
      translationsObj[language]?.[key] || translationsObj.English?.[key] || key
    );
  } catch (e) {
    console.error('getTranslation error:', e);
    return key;
  }
}

function updateNavUI() {
  try {
    const navLinks = document.querySelectorAll('nav a');
    if (!navLinks || navLinks.length < 5) return;

    navLinks[0].textContent = getTranslation('dashboardNav', navTranslations);
    navLinks[1].textContent = getTranslation('addTripNav', navTranslations);
    navLinks[2].textContent = getTranslation('mapNav', navTranslations);
    navLinks[3].textContent = getTranslation('weatherNav', navTranslations);
    navLinks[4].textContent = getTranslation('settingsNav', navTranslations);
  } catch (e) {
    console.error('updateNavUI error:', e);
  }
}
