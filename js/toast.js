const toastContainer = document.getElementById('toast-container');
let wasOffline = !navigator.onLine;

function showToast(message, duration = 3000, confirmCallback = null) {
  if (!toastContainer) return;
  if (typeof message !== 'string') return;

  try {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const msg = document.createElement('div');
    msg.textContent = message;
    toast.appendChild(msg);

    if (confirmCallback && typeof confirmCallback === 'function') {
      const actions = document.createElement('div');
      actions.className = 'actions';

      const btnYes = document.createElement('button');
      btnYes.textContent =
        (typeof getTranslation === 'function'
          ? getTranslation('Yes')
          : 'Tak') || 'Tak';
      btnYes.className = 'btn-confirm';

      const btnNo = document.createElement('button');
      btnNo.textContent =
        (typeof getTranslation === 'function' ? getTranslation('No') : 'Nie') ||
        'Nie';
      btnNo.className = 'btn-cancel';

      const remove = () => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), {
          once: true,
        });
      };

      btnYes.onclick = () => {
        remove();
        confirmCallback();
      };
      btnNo.onclick = remove;

      actions.append(btnYes, btnNo);
      toast.appendChild(actions);

      setTimeout(remove, duration || 8000);
    }

    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    if (!confirmCallback) {
      setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove(), {
          once: true,
        });
      }, duration);
    }
  } catch (e) {
    console.error('showToast error:', e);
  }
}

function tryShowToast() {
  try {
    if (typeof getTranslation !== 'function' || !navTranslations) {
      setTimeout(tryShowToast, 100);
      return;
    }

    const isOffline = !navigator.onLine;

    if (isOffline && !wasOffline) {
      showToast(
        getTranslation('offlineToast', navTranslations) || 'Brak połączenia',
        5000
      );
    } else if (!isOffline && wasOffline) {
      showToast(
        getTranslation('onlineToast', navTranslations) ||
          'Połączenie przywrócone',
        3000
      );
    }

    wasOffline = isOffline;
  } catch (e) {
    console.error('tryShowToast error:', e);
  }
}

if (typeof window !== 'undefined') {
  try {
    window.addEventListener('online', tryShowToast);
    window.addEventListener('offline', tryShowToast);
    window.addEventListener('load', tryShowToast);
  } catch (e) {
    console.error('Error adding global event listeners', e);
  }
}
