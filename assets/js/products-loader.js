// ============================================================
// Roseller — products-loader.js
// Fetches products from Cloudflare KV via the CDN worker.
// Populates window.ROSELLER_PRODUCTS, then dispatches
// 'products:loaded' so any renderer can react.
// Falls back to window.ROSELLER_PRODUCTS_FALLBACK (from
// data/products-fallback.js) if the CDN is unreachable.
// ============================================================
(function () {
  'use strict';

  const CDN_URL = 'https://roseller-cdn.rainfowbd-dev.workers.dev/products.json';

  // Initialize as empty so any renderer that fires too early
  // renders nothing instead of crashing
  window.ROSELLER_PRODUCTS = window.ROSELLER_PRODUCTS || [];

  (async function load() {
    try {
      const res = await fetch(CDN_URL, { cache: 'default' });
      if (!res.ok) throw new Error('CDN responded ' + res.status);
      const json = await res.json();
      if (!Array.isArray(json)) throw new Error('CDN did not return an array');

      window.ROSELLER_PRODUCTS = json;
      console.log('[products] loaded from CDN:', json.length);
    } catch (err) {
      console.warn('[products] CDN failed, using fallback:', err.message);

      // If data/products.js was loaded on this page, it already set
      // window.ROSELLER_PRODUCTS. Keep that as the fallback.
      // If not, load the fallback file.
      if (!window.ROSELLER_PRODUCTS || !window.ROSELLER_PRODUCTS.length) {
        try {
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'data/products.js';
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
          });
        } catch {}
      }
    } finally {
      document.dispatchEvent(new CustomEvent('products:loaded', {
        detail: { count: window.ROSELLER_PRODUCTS.length }
      }));
    }
  })();
})();