window.addEventListener('load', () => {
  const isDark = localStorage.getItem('darkTheme') === 'true';
  if (isDark) document.body.classList.add('dark-theme');
});

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('darkTheme', isDark);
}
