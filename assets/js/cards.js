/* =========================================================
   Roseller — cards.js
   Shared product-card renderer + grid renderer.
   Requires: window.RosellerWishlist (optional)
   ========================================================= */
(function () {
  'use strict';

  function fmt(n) { return '৳' + Number(n || 0).toLocaleString('en-BD'); }

  function heartSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>' +
      '</svg>';
  }

  /* ============================================================
     PRODUCT CARD
     ============================================================ */
  window.RosellerCard = function (p) {
    const old = p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : '';
    const wishlisted = window.RosellerWishlist && window.RosellerWishlist.has(p.id);
    const label = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';
    const productUrl = `product.html?id=${encodeURIComponent(p.id)}`;

    return `
      <article class="product-card">
        <button type="button"
                class="wishlist-toggle ${wishlisted ? 'is-active' : ''}"
                data-wishlist-toggle="${p.id}"
                aria-pressed="${wishlisted ? 'true' : 'false'}"
                aria-label="${label}"
                title="${label}">
          ${heartSVG()}
        </button>
        <a href="${productUrl}" class="product-media">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
          <img src="${p.image || ''}" alt="${p.name || ''}" loading="lazy">
        </a>
        <div class="product-body">
          <h3 class="product-title"><a href="${productUrl}">${p.name || '(unnamed)'}</a></h3>
          <div class="product-price">${fmt(p.price)} ${old}</div>
          <div class="product-stock">${p.stock || 'In Stock'}</div>
          <button class="btn-add" data-add-id="${p.id}" type="button">Add to Cart</button>
        </div>
      </article>`;
  };

  /* ============================================================
     GRID RENDERER
     Renders every [data-products] grid on the page.
     Re-renders when products change (CDN reload, filter).
     ============================================================ */
  function renderGrids() {
    const all = window.ROSELLER_PRODUCTS || [];
    if (!all.length) return;

    document.querySelectorAll('[data-products]').forEach(grid => {
      const filter  = grid.getAttribute('data-filter') || 'all';
      const limit   = grid.getAttribute('data-limit');

      let list = all;
      if (filter === 'featured')        list = list.filter(p => p.featured);
      else if (filter === 'bestseller') list = list.filter(p => p.bestseller);
      else if (filter !== 'all')        list = list.filter(p => p.category === filter);
      if (limit) list = list.slice(0, parseInt(limit, 10));

      /* Only re-render if the content actually changed.
         Compare a lightweight signature. */
      const signature = filter + ':' + list.map(p => p.id).join(',');
      if (grid.dataset.signature === signature) return;

      grid.innerHTML = list.length
        ? list.map(p => window.RosellerCard(p)).join('')
        : '<div class="products-empty" style="grid-column:1/-1"><div class="empty-icon">👗</div><h2>No products found</h2></div>';

      grid.dataset.signature = signature;
      /* Also drop the legacy flag so nothing else depends on it */
      delete grid.dataset.rendered;
    });
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  document.addEventListener('DOMContentLoaded', renderGrids);
  document.addEventListener('partials:loaded', renderGrids);
  document.addEventListener('roseller:content', renderGrids);
  document.addEventListener('products:loaded', renderGrids);

  /* Expose for other modules that may want to force a re-render */
  window.RosellerCards = { renderGrids };
})();