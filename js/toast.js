const toastContainer = document.getElementById('toast-container');
//Wyswietlanie powiadomienia, znika po 3s
function showToast(message, duration = 3000) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show')); //animacja
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove()); //usuniecie elementu
  }, duration);
}

let wasOffline = !navigator.onLine; // info o stanie sieci
//Sprawdzenie stanu sieci
function tryShowToast() {
  if (typeof getTranslation !== 'function' || !navTranslations) {
    setTimeout(tryShowToast, 100);
    return;
  }
  // Logika do zmiany stanu
  const isOffline = !navigator.onLine;
  if (isOffline && !wasOffline) {
    showToast(getTranslation('offlineToast', navTranslations), 5000);
  } else if (!isOffline && wasOffline) {
    showToast(getTranslation('onlineToast', navTranslations), 3000);
  }
  wasOffline = isOffline;
}

// Nasluchiwanie zmian
window.addEventListener('online', tryShowToast);
window.addEventListener('offline', tryShowToast);
window.addEventListener('load', tryShowToast);
