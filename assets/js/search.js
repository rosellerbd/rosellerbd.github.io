/* =========================================================
   Roseller — search.js
   - Header search + suggestions (all pages)
   - Live results on search.html
   ========================================================= */
(function () {
  'use strict';

  function fmt(n) { return '৳' + Number(n || 0).toLocaleString('en-BD'); }
  function getProducts() { return window.ROSELLER_PRODUCTS || []; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));
  }

  function highlight(text, q) {
    const safe = escapeHtml(text);
    if (!q) return safe;
    const words = q.split(/\s+/).filter(Boolean).map(w =>
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    if (!words.length) return safe;
    return safe.replace(new RegExp('(' + words.join('|') + ')', 'gi'), '<mark>$1</mark>');
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), wait);
    };
  }

  function matches(p, q) {
    if (!q) return false;
    const needle = q.toLowerCase().trim();
    if (!needle) return false;
    const haystack = (p.name + ' ' + (p.brand || '') + ' ' + (p.category || '') + ' ' + (p.id || '')).toLowerCase();
    return needle.split(/\s+/).every(w => haystack.indexOf(w) !== -1);
  }
  function searchProducts(q) { return getProducts().filter(p => matches(p, q)); }

  /* ---------------------------------------------------------
     Header search + suggestions (every page)
     --------------------------------------------------------- */
  function bindHeaderSearch() {
    const form  = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const box   = document.getElementById('search-suggestions');
    if (!form || !input || !box) return;
    if (input.dataset.searchBound === '1') return;
    input.dataset.searchBound = '1';

    const isResultsPage = !!document.getElementById('search-results-grid');
    let activeIndex = -1;

    function renderSuggestions(q) {
      if (!q || !q.trim()) { box.hidden = true; box.innerHTML = ''; return; }
      const results = searchProducts(q).slice(0, 6);
      activeIndex = -1;

      if (!results.length) {
        box.innerHTML = `<div class="search-no-results">No products found for "<strong>${escapeHtml(q)}</strong>"</div>`;
        box.hidden = false;
        return;
      }
      box.innerHTML = results.map(p => `
        <a href="product.html?id=${p.id}" class="search-suggestion">
          <img src="${p.image}" alt="" class="ss-img">
          <div class="ss-info">
            <div class="ss-name">${highlight(p.name, q)}</div>
            <div class="ss-meta">${escapeHtml(p.brand || '')} · ${fmt(p.price)}</div>
          </div>
        </a>`).join('') +
        `<a href="search.html?q=${encodeURIComponent(q)}" class="search-suggestion search-view-all">
           <span class="ss-view-all">🔍 View all results for "<strong>${escapeHtml(q)}</strong>"</span>
         </a>`;
      box.hidden = false;
    }

    function hideSuggestions() { box.hidden = true; box.innerHTML = ''; activeIndex = -1; }

    const liveUpdate = debounce(function (q) {
      if (typeof window.renderSearchResults === 'function') {
        window.renderSearchResults(q, { updateUrl: true, scrollTop: false });
      }
    }, 150);

    input.addEventListener('input', () => {
      if (isResultsPage) { hideSuggestions(); liveUpdate(input.value); }
      else renderSuggestions(input.value);
    });
    input.addEventListener('focus', () => {
      if (!isResultsPage && input.value.trim()) renderSuggestions(input.value);
    });

    input.addEventListener('keydown', e => {
      const items = box.querySelectorAll('.search-suggestion');
      if (!items.length) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % items.length;
        items.forEach((el, i) => el.classList.toggle('is-active', i === activeIndex));
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle('is-active', i === activeIndex));
        items[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        items[activeIndex].click();
      } else if (e.key === 'Escape') {
        hideSuggestions(); input.blur();
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = input.value.trim(); if (!q) return;
      hideSuggestions();
      if (isResultsPage) {
        if (typeof window.renderSearchResults === 'function') {
          window.renderSearchResults(q, { updateUrl: true, scrollTop: true });
        }
      } else {
        location.href = 'search.html?q=' + encodeURIComponent(q);
      }
    });

    document.addEventListener('click', e => { if (!form.contains(e.target)) hideSuggestions(); });
    box.addEventListener('click', () => setTimeout(hideSuggestions, 0));
  }

  /* ---------------------------------------------------------
     Results page (search.html)
     --------------------------------------------------------- */
  function initResultsPage() {
    const grid = document.getElementById('search-results-grid');
    if (!grid) return;

    const emptyEl = document.getElementById('search-empty');
    const countEl = document.getElementById('search-count');
    const titleEl = document.getElementById('search-query-label');
    const input   = document.getElementById('search-input');

    function renderResults(rawQ, opts) {
      opts = opts || {};
      const q = (rawQ || '').trim();

      if (opts.updateUrl) {
        try {
          const url = new URL(location.href);
          if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
          history.replaceState(null, '', url.pathname + (url.search || ''));
        } catch (_) {}
      }
      if (input && input.value !== q) input.value = q;
      document.title = q ? `"${q}" — Search — Roseller` : 'Search — Roseller';

      if (!q) {
        if (titleEl) titleEl.textContent = '—';
        if (countEl) countEl.textContent = 'Type a keyword to search products.';
        grid.innerHTML = '';
        if (emptyEl) {
          emptyEl.innerHTML = `
            <div class="empty-icon">🔍</div>
            <h2>Search for products</h2>
            <p>Try a product name, brand, or category — like "kurti", "saree" or "Ecstasy".</p>
            <a href="products.html" class="btn-primary">Browse All Products →</a>`;
          emptyEl.classList.remove('hidden');
        }
        return;
      }

      const results = searchProducts(q);

      if (!results.length) {
        grid.innerHTML = '';
        if (titleEl) titleEl.textContent = q;
        if (countEl) countEl.textContent = `No products found for "${q}"`;
        if (emptyEl) {
          emptyEl.innerHTML = `
            <div class="empty-icon">📦</div>
            <h2>No products found</h2>
            <p>We couldn't find anything matching "<strong>${escapeHtml(q)}</strong>". Try a different keyword.</p>
            <a href="products.html" class="btn-primary">Browse All Products →</a>`;
          emptyEl.classList.remove('hidden');
        }
        return;
      }

      if (emptyEl) emptyEl.classList.add('hidden');
      if (titleEl) titleEl.textContent = q;
      if (countEl) countEl.textContent = `Found ${results.length} product${results.length !== 1 ? 's' : ''} for "${q}"`;
      grid.innerHTML = results.map(window.RosellerCard).join('');
      document.dispatchEvent(new CustomEvent('wishlist:updated'));

      if (opts.scrollTop) {
        const top = grid.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    window.renderSearchResults = renderResults;
    const initialQ = new URLSearchParams(location.search).get('q') || '';
    if (input) input.value = initialQ;
    renderResults(initialQ, { updateUrl: false, scrollTop: false });
  }

  function initAll() { bindHeaderSearch(); initResultsPage(); }
  document.addEventListener('DOMContentLoaded', initAll);
  document.addEventListener('partials:loaded', bindHeaderSearch);
  if (document.readyState !== 'loading') initAll();
})();