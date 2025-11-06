function getTranslation(key, translationsObj = translations) {
  // Pobranie tlumaczenia
  const language = localStorage.getItem('language') || 'English'; // sprawdzenie zapisanego jezyka, domyslnie ang
  return (
    translationsObj[language]?.[key] || translationsObj.English?.[key] || key
  );
}
// Alktualizacja tekstu w pasku nawigacji
function updateNavUI() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks[0].textContent = getTranslation('dashboardNav', navTranslations);
  navLinks[1].textContent = getTranslation('addTripNav', navTranslations);
  navLinks[2].textContent = getTranslation('mapNav', navTranslations);
  navLinks[3].textContent = getTranslation('weatherNav', navTranslations);
  navLinks[4].textContent = getTranslation('settingsNav', navTranslations);
}
