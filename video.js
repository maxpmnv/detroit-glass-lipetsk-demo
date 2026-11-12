(() => {
  'use strict';

  const dialog = document.createElement('dialog');
  dialog.className = 'film-dialog';
  dialog.setAttribute('aria-labelledby', 'film-video-title');
  dialog.innerHTML = `
    <div class="film-toolbar">
      <button class="film-close" type="button" aria-label="Закрыть видео" autofocus>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <div class="film-panel">
      <div class="film-media">
        <video class="film-player" controls playsinline preload="none"></video>
        <p class="film-status" role="status" aria-live="polite" hidden></p>
      </div>
      <div class="film-copy">
        <h2 class="film-title" id="film-video-title"></h2>
        <p class="film-caption">Исходное видео из Telegram-канала студии.</p>
        <div class="film-links">
          <a class="film-case">Подробнее о работе</a>
          <a class="film-source" target="_blank" rel="noopener noreferrer">Оригинал в Telegram</a>
        </div>
      </div>
    </div>`;
  document.body.append(dialog);

  const video = dialog.querySelector('.film-player');
  const status = dialog.querySelector('.film-status');
  const title = dialog.querySelector('.film-title');
  const caption = dialog.querySelector('.film-caption');
  const source = dialog.querySelector('.film-source');
  const caseLink = dialog.querySelector('.film-case');
  const closeButton = dialog.querySelector('.film-close');
  let trigger = null;
  let active = false;
  let generation = 0;
  let backdropPress = false;

  function announce(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function stopMedia() {
    active = false;
    generation += 1;
    video.pause();
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.load();
    announce('');
  }

  function safeUrl(value, localOnly = false) {
    if (!value) return null;
    try {
      const url = new URL(value, document.baseURI);
      if (!['http:', 'https:', 'file:'].includes(url.protocol)) return null;
      if (localOnly && url.origin !== location.origin) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function setLink(link, value, localOnly) {
    const url = safeUrl(value, localOnly);
    link.hidden = !url;
    if (url) link.href = url;
    else link.removeAttribute('href');
  }

  function isOutside(event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
  }

  document.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('button[data-video]') : null;
    if (!button || button.disabled) return;

    const mediaUrl = safeUrl(button.dataset.video, true);
    trigger = button;
    stopMedia();
    const [vehicle, ...task] = (button.dataset.title || 'Видео работы DETROIT').split(' · ');
    title.textContent = vehicle;
    caption.textContent = task.join(' · ') || 'Исходное видео из Telegram-канала студии.';
    setLink(source, button.dataset.source, false);
    setLink(caseLink, button.dataset.case, true);
    dialog.dataset.input = event.detail === 0 ? 'keyboard' : 'pointer';
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('film-open');
    if (typeof lockPage === 'function') lockPage('film');
    dialog.scrollTop = 0;
    closeButton.focus({ preventScroll: true });

    if (!mediaUrl) {
      announce('Видео недоступно. Откройте исходную публикацию в Telegram.');
      return;
    }

    active = true;
    const currentGeneration = generation;
    const posterUrl = safeUrl(button.dataset.poster, true);
    if (posterUrl) video.poster = posterUrl;
    video.src = mediaUrl;
    announce('Загружаем видео…');
    // Playback is requested only by this explicit visitor click.
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch((error) => {
        if (!active || generation !== currentGeneration || error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError') {
          announce('Нажмите кнопку воспроизведения на видео.');
        } else {
          announce('Не удалось воспроизвести видео. Оригинал доступен в Telegram.');
        }
      });
    }
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    dialog.close();
  });
  dialog.addEventListener('pointerdown', (event) => {
    backdropPress = event.target === dialog && isOutside(event);
  });
  dialog.addEventListener('click', (event) => {
    if (backdropPress && event.target === dialog && isOutside(event)) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener('close', () => {
    stopMedia();
    document.documentElement.classList.remove('film-open');
    if (typeof unlockPage === 'function') unlockPage('film');
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    trigger = null;
  });

  video.addEventListener('waiting', () => {
    if (active) announce('Загружаем видео…');
  });
  video.addEventListener('playing', () => {
    if (active) announce('');
  });
  video.addEventListener('canplay', () => {
    if (active && !video.error) announce('');
  });
  video.addEventListener('stalled', () => {
    if (active && video.readyState < 3) {
      announce('Загрузка задерживается. Можно открыть оригинал в Telegram.');
    }
  });
  video.addEventListener('error', () => {
    if (active) announce('Видео не загрузилось. Откройте оригинал в Telegram.');
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && dialog.open) video.pause();
  });
})();
