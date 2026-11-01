// ============================================================
// Roseller — wishlist-db.js
// Dashboard-side wishlist helper. Delegates to RosellerWishlist.
// ============================================================
(function () {
  'use strict';

  async function currentUser() {
    if (!window.RosellerAuth) return null;
    await window.RosellerAuth.onReady();
    return window.RosellerAuth.currentUser;
  }

  async function getIds() {
    const user = await currentUser();
    if (!user || !window.RosellerSupabase) return [];
    const { data, error } = await window.RosellerSupabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', user.uid);
    if (error) { console.error('[wishlist-db] read', error); return []; }
    return (data || []).map(r => r.product_id);
  }

  async function toggle(productId) {
    if (window.RosellerWishlist) return window.RosellerWishlist.toggle(productId);
    return false;
  }

  async function has(productId) {
    if (window.RosellerWishlist) return window.RosellerWishlist.has(productId);
    return false;
  }

  async function mergeLocalIntoDb() {
    const user = await currentUser();
    if (!user) return;
    if (!window.RosellerWishlist || !window.RosellerSupabase) return;

    const local = window.RosellerWishlist.getIdsLocal
      ? window.RosellerWishlist.getIdsLocal()
      : [];
    if (!local.length) return;

    for (const id of local) {
      await window.RosellerWishlist.add(id);
    }
    try {
      localStorage.removeItem('roseller_wishlist_v1');
      document.dispatchEvent(new CustomEvent('wishlist:updated'));
    } catch {}
  }

  window.RosellerWishlistDB = { getIds, toggle, has, mergeLocalIntoDb };

  document.addEventListener('auth:changed', async e => {
    if (e.detail.user) await mergeLocalIntoDb();
  });
})();