/* =========================================================
   Roseller — products-page.js
   ========================================================= */
(function () {
  'use strict';

  const grid       = document.getElementById('all-products-grid');
  if (!grid) return;
  const emptyState = document.getElementById('products-empty');
  const countEl    = document.getElementById('products-count');
  const chipWrap   = document.getElementById('filter-chips');
  const sortSelect = document.getElementById('sort-select');

  let activeFilter = 'all';
  let activeSort   = 'default';

  function render() {
    let list = window.ROSELLER_PRODUCTS || [];
    if (activeFilter === 'featured')        list = list.filter(p => p.featured);
    else if (activeFilter === 'bestseller') list = list.filter(p => p.bestseller);
    else if (activeFilter !== 'all')        list = list.filter(p => p.category === activeFilter);

    const copy = list.slice();
    switch (activeSort) {
      case 'price-asc':  copy.sort((a, b) => a.price - b.price); break;
      case 'price-desc': copy.sort((a, b) => b.price - a.price); break;
      case 'name-asc':   copy.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':  copy.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    if (!copy.length) {
      grid.innerHTML = '';
      emptyState && emptyState.classList.remove('hidden');
      if (countEl) countEl.textContent = 'No products found.';
      return;
    }
    emptyState && emptyState.classList.add('hidden');
    grid.innerHTML = copy.map(window.RosellerCard).join('');
    if (countEl) countEl.textContent = `Showing ${copy.length} product${copy.length !== 1 ? 's' : ''}`;
  }

  chipWrap && chipWrap.addEventListener('click', e => {
    const chip = e.target.closest('.chip'); if (!chip) return;
    chipWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    activeFilter = chip.getAttribute('data-filter') || 'all';
    render();
  });

  sortSelect && sortSelect.addEventListener('change', () => {
    activeSort = sortSelect.value; render();
  });

  function init() {
    if ((window.ROSELLER_PRODUCTS || []).length) render();
  }
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState !== 'loading') init();
})();