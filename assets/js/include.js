(function () {
  'use strict';

  function loadPartial(el) {
    const path = el.getAttribute('data-include');
    if (!path) return Promise.resolve();
    return fetch(path, { cache: 'no-cache' })
      .then(r => r.ok ? r.text() : Promise.reject(new Error(path + ': ' + r.status)))
      .then(html => { el.innerHTML = html; })
      .catch(err => { console.error('[include]', err); el.innerHTML = ''; });
  }

  function loadAll() {
    const targets = Array.from(document.querySelectorAll('[data-include]'));
    return Promise.all(targets.map(loadPartial)).then(() => {
      document.dispatchEvent(new CustomEvent('partials:loaded'));
      initHeader();
      initYear();
      initContact();
    });
  }

  function initHeader() {
    const btn  = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    const clone = btn.cloneNode(true);
    btn.replaceWith(clone);
    clone.addEventListener('click', () => {
      menu.classList.toggle('hidden');
      clone.setAttribute('aria-expanded', String(!menu.classList.contains('hidden')));
    });
  }

  function initYear() {
    const y = document.getElementById('footer-year');
    if (y) y.textContent = new Date().getFullYear();
  }

  function initContact() {
    const brand = (window.ROSELLER && window.ROSELLER.brand) || {};
    const wa    = brand.whatsapp || '8801876757033';
    const tel   = brand.phone   || '+8801876757033';

    document.querySelectorAll('[data-wa-link]').forEach(a => {
      const msg = a.getAttribute('data-wa-message') || 'Hi Roseller';
      a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(msg);
    });
    document.querySelectorAll('[data-tel-link]').forEach(a => { a.href = 'tel:' + tel; });
    document.querySelectorAll('[data-phone-text]').forEach(el => { el.textContent = tel; });
  }

  document.addEventListener('roseller:content', initContact);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadAll);
  else loadAll();
})();