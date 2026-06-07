(function () {
  // ── Límite de velocidad 1.25x ─────────────────────────────────
  const MAX = 1.25;
  const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'playbackRate');
  if (desc) {
    Object.defineProperty(HTMLMediaElement.prototype, 'playbackRate', {
      get() { return desc.get.call(this); },
      set(v) { desc.set.call(this, v > MAX ? MAX : v); },
      configurable: true,
    });
  }

  // ── Ocultar Shorts ────────────────────────────────────────────
  const CSS = `
    ytd-reel-shelf-renderer,
    ytd-rich-section-renderer,
    ytd-reel-item-renderer,
    ytd-inline-shorts-card-renderer,
    ytd-shorts-lockup-view-model,
    ytd-reel-video-renderer,
    ytd-shorts,
    [is-shorts],
    a[href^="/shorts"],
    a[href*="/shorts/"] {
      display: none !important;
    }
  `;

  function injectCSS() {
    if (document.getElementById('fb-no-shorts')) return;
    const s = document.createElement('style');
    s.id = 'fb-no-shorts';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  function removeShortsDom() {
    document.querySelectorAll(
      'ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-reel-item-renderer, ytd-shorts, [is-shorts]'
    ).forEach(el => el.remove());
  }

  function run() { injectCSS(); removeShortsDom(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  window.addEventListener('yt-navigate-finish', run);

  let debounce;
  new MutationObserver(() => {
    clearTimeout(debounce);
    debounce = setTimeout(removeShortsDom, 300);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
