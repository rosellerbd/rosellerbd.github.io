/* =========================================================
   Roseller — ticker.js
   Populates the mid-page notice ticker from window.ROSELLER.notices.
   Auto-hides if empty. Re-renders whenever roseller:content fires.
   ========================================================= */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  function buildTrack(notices) {
    const items = notices
      .map(n => `<span class="notice-ticker-item">${escapeHtml(n)}</span>`)
      .join('<span class="notice-ticker-sep" aria-hidden="true">•</span>');

    return `<div class="notice-ticker-segment">${items}</div>`
         + `<div class="notice-ticker-segment" aria-hidden="true">${items}</div>`;
  }

  function mount() {
    const wrap  = document.getElementById('notice-ticker');
    const track = document.getElementById('notice-ticker-track');
    if (!wrap || !track) return;

    const notices = (window.ROSELLER && window.ROSELLER.notices) || [];
    if (!notices.length) { wrap.hidden = true; return; }

    track.innerHTML = buildTrack(notices);

    const seg = track.querySelector('.notice-ticker-segment');
    if (seg) {
      const seconds = Math.max(18, Math.min(60, seg.scrollWidth / 60));
      track.style.setProperty('--ticker-duration', seconds.toFixed(1) + 's');
    }

    wrap.hidden = false;
  }

  document.addEventListener('roseller:content', mount);
  document.addEventListener('DOMContentLoaded', mount);
  if (document.readyState !== 'loading') mount();
})();