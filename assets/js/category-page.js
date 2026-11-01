/* =========================================================
   Roseller — category-page.js
   ========================================================= */
(function () {
  'use strict';
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  let rendered = false;

  function render() {
    const slug = new URLSearchParams(location.search).get('c') || 'mens-shirt';
    const cats = (window.ROSELLER && window.ROSELLER.categories) || [];
    const cat  = cats.find(c => c.slug === slug);
    const name = cat ? cat.name : 'Products';

    const titleEl = document.getElementById('category-title');
    const crumbEl = document.getElementById('category-crumb');
    if (titleEl) titleEl.textContent = name;
    if (crumbEl) crumbEl.textContent = name;
    document.title = name + ' — Roseller';

    const list = (window.ROSELLER_PRODUCTS || []).filter(p => p.category === slug);
    if (!list.length) {
      grid.innerHTML = '<div class="products-empty" style="grid-column:1/-1;"><div class="empty-icon">👗</div><h2>No products in this category yet</h2></div>';
    } else {
      grid.innerHTML = list.map(window.RosellerCard).join('');
    }
    rendered = true;
  }

  function tryRender() {
    if (!(window.ROSELLER_PRODUCTS || []).length) return;
    if (!window.ROSELLER || !window.ROSELLER.loaded) return;
    if (rendered) return;
    render();
  }

  document.addEventListener('roseller:content', tryRender);
  document.addEventListener('partials:loaded', tryRender);
  document.addEventListener('DOMContentLoaded', tryRender);
  if (document.readyState !== 'loading') tryRender();
})();