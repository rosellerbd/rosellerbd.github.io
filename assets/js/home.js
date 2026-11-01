/* =========================================================
   Roseller — home.js
   Brand strip, hero banner slider, (ticker handled in ticker.js)
   ========================================================= */
(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  /* ---------- Brand strip (content-driven) ---------- */
  document.addEventListener('roseller:content', function () {
    const brandWrap = document.getElementById('brand-strip');
    if (!brandWrap) return;
    const brands = (window.ROSELLER && window.ROSELLER.brands) || [];
    brandWrap.innerHTML = brands.length
      ? brands.map(b => `<span class="brand-pill">${escapeHtml(b)}</span>`).join('')
      : '';
  });

  /* ---------- Hero banner slider ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const slider = document.getElementById('hero-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    const dots   = slider.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    let current = 0;
    let timer = null;
    const INTERVAL = 5000;

    function goTo(index) {
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      current = index;
    }
    function next() { goTo((current + 1) % slides.length); }
    function start() { stop(); timer = setInterval(next, INTERVAL); }
    function stop()  { if (timer) clearInterval(timer); timer = null; }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goTo(parseInt(dot.getAttribute('data-slide'), 10));
        start();
      });
    });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);

    let touchStartX = 0;
    slider.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      stop();
    }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo((current + 1) % slides.length);
        else goTo((current - 1 + slides.length) % slides.length);
      }
      start();
    }, { passive: true });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) goTo(0);
    else start();
  });
})();