// ============================================================
// Roseller — cart-db.js
// Thin wrapper for the dashboard. All real work is in RosellerCart.
// ============================================================
(function () {
  'use strict';

  async function currentUser() {
    if (!window.RosellerAuth) return null;
    await window.RosellerAuth.onReady();
    return window.RosellerAuth.currentUser;
  }

  async function getItems() {
    const user = await currentUser();
    if (!user || !window.RosellerSupabase) return [];
    const { data, error } = await window.RosellerSupabase
      .from('carts')
      .select('product_id, qty')
      .eq('user_id', user.uid);
    if (error) { console.error('[cart-db] read', error); return []; }
    return (data || []).map(r => ({ id: r.product_id, qty: r.qty }));
  }

  async function add(product, qty = 1) {
    if (window.RosellerCart) {
      await window.RosellerCart.add(product, qty);
    }
  }

  async function setQty(productId, qty) {
    if (window.RosellerCart) {
      if (qty <= 0) await window.RosellerCart.remove(productId);
      else await window.RosellerCart.setQty(productId, qty);
    }
  }

  async function remove(productId) {
    if (window.RosellerCart) await window.RosellerCart.remove(productId);
  }

  async function clear() {
    if (window.RosellerCart) await window.RosellerCart.clear();
  }

  /* Merge any localStorage cart into Supabase after login */
  async function mergeLocalIntoDb() {
    const user = await currentUser();
    if (!user) return;
    if (!window.RosellerCart) return;

    const local = window.RosellerCart.getItemsLocal
      ? window.RosellerCart.getItemsLocal()
      : [];
    if (!local.length) return;

    for (const item of local) {
      await window.RosellerCart.add({ id: item.id }, item.qty);
    }
    // Clear the local copy now that it's on the server
    try {
      localStorage.removeItem('roseller_cart_v1');
      document.dispatchEvent(new CustomEvent('cart:updated'));
    } catch {}
  }

  window.RosellerCartDB = {
    getItems,
    add,
    setQty,
    remove,
    clear,
    mergeLocalIntoDb
  };

  document.addEventListener('auth:changed', async e => {
    if (e.detail.user) await mergeLocalIntoDb();
  });
})();