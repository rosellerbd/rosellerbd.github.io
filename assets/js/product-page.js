/* =========================================================
   Roseller — product-page.js
   ========================================================= */
(function () {
  'use strict';
  if (!document.getElementById('product-detail')) return;

  function fmt(n) { return '৳' + Number(n || 0).toLocaleString('en-BD'); }

  function heartSVG() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>' +
      '</svg>';
  }

  let rendered = false;

  function init() {
    if (rendered) return;
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const list = window.ROSELLER_PRODUCTS || [];
    const p = list.find(x => x.id === id);

    if (!p) {
      document.getElementById('product-detail').innerHTML =
        '<div class="products-empty">' +
          '<div class="empty-icon">👗</div>' +
          '<h2>Product not found</h2>' +
          '<p>The product you\'re looking for doesn\'t exist or has been removed.</p>' +
          '<a href="products.html" class="btn-primary">Browse Products →</a>' +
        '</div>';
      rendered = true;
      return;
    }

    document.title = p.name + ' — Roseller';
    const bc = document.getElementById('breadcrumb-current');
    if (bc) bc.textContent = p.name;

    const old = p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : '';
    const wishlisted = window.RosellerWishlist && window.RosellerWishlist.has(p.id);
    const wishLabel = wishlisted ? 'Remove from wishlist' : 'Add to wishlist';

    document.getElementById('product-detail').innerHTML = `
      <div class="product-detail-grid">
        <div class="pdetail-media">
          ${p.tag ? `<span class="product-tag">${p.tag}</span>` : ''}
          <button type="button"
                  class="wishlist-toggle ${wishlisted ? 'is-active' : ''}"
                  data-wishlist-toggle="${p.id}"
                  aria-pressed="${wishlisted ? 'true' : 'false'}"
                  aria-label="${wishLabel}"
                  title="${wishLabel}">
            ${heartSVG()}
          </button>
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="pdetail-info">
          <h1>${p.name}</h1>
          <div class="pdetail-sku">SKU: ${p.id} · Brand: ${p.brand || 'Roseller'}</div>
          <div class="pdetail-price">${fmt(p.price)} ${old}</div>
          <div class="pdetail-stock">${p.stock || 'In Stock'}</div>
          <div class="pdetail-meta">
            <div><strong>Return Policy:</strong> ${p.warranty || '7 Days Return'}</div>
            <div><strong>Category:</strong> ${p.category}</div>
            <div><strong>Available Sizes:</strong> S · M · L · XL · XXL</div>
            <div><strong>Available Colors:</strong> Multiple options</div>
          </div>
          <div class="pdetail-actions">
            <div class="qty-control" role="group" aria-label="Quantity">
              <button type="button" class="qty-btn" id="pdetail-minus" aria-label="Decrease quantity">−</button>
              <input type="text" class="qty-input" id="pdetail-qty" value="1" readonly aria-label="Quantity">
              <button type="button" class="qty-btn" id="pdetail-plus" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn-add btn-add-lg" id="pdetail-add" type="button">Add to Cart</button>
          </div>
          <div class="pdetail-desc">
            <h3>Description</h3>
            <p>Premium quality ${p.category.replace(/-/g,' ')} from ${p.brand || 'Roseller'}. Made with comfortable, breathable fabric — perfect for everyday wear. Available in multiple sizes. Easy 7-day return policy.</p>
          </div>
        </div>
      </div>`;

    const qtyInput = document.getElementById('pdetail-qty');
    const minusBtn = document.getElementById('pdetail-minus');
    const plusBtn  = document.getElementById('pdetail-plus');
    const addBtn   = document.getElementById('pdetail-add');

    plusBtn.addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) + 1);
    });
    minusBtn.addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value, 10) - 1);
    });
    addBtn.addEventListener('click', function () {
      const qty = parseInt(qtyInput.value, 10) || 1;
      if (!window.RosellerCart) return;
      window.RosellerCart.add(p, qty);
      this.textContent = '✓ Added to Cart';
      this.disabled = true;
      setTimeout(() => {
        this.textContent = 'Add to Cart';
        this.disabled = false;
      }, 1400);
    });

    rendered = true;

    /* Make sure heart reflects state immediately (in case wishlist.js hasn't run syncHearts yet) */
    if (window.RosellerWishlist) {
      document.dispatchEvent(new CustomEvent('wishlist:updated'));
    }
  }

  function tryInit() {
    if (!(window.ROSELLER_PRODUCTS || []).length) return;
    init();
  }

  document.addEventListener('partials:loaded', tryInit);
  document.addEventListener('DOMContentLoaded', tryInit);
  if (document.readyState !== 'loading') tryInit();
})();