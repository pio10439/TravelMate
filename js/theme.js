window.addEventListener('load', () => {
  try {
    const body = document.body;
    if (!body) return;
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) body.classList.add('dark-theme');
  } catch (e) {
    console.warn('Error reading darkTheme from localStorage', e);
  }
});

function toggleTheme() {
  try {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('dark-theme');
    const isDark = body.classList.contains('dark-theme');
    localStorage.setItem('darkTheme', isDark);
  } catch (e) {
    console.warn('Error saving darkTheme to localStorage', e);
  }
}
