// ============================================================
// Roseller — cart.js (v3, optimistic)
// ============================================================
(function () {
  'use strict';

  const KEY = 'roseller_cart_v1';

  /* ---------- localStorage (signed-out fallback) ---------- */
  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function writeLocal(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent('cart:updated'));
  }

  /* ---------- readiness helpers ---------- */
  function authReady() {
    return !!(window.RosellerAuth && window.RosellerAuth.currentUser);
  }
  function sbReady() {
    return !!(window.RosellerSupabase && typeof window.RosellerSupabase.from === 'function');
  }
  function uid() {
    return window.RosellerAuth?.currentUser?.uid || null;
  }

  /* ============================================================
     Cart API (all async, but writes return immediately)
     ============================================================ */
  const Cart = {
    async getItems() {
      if (authReady() && sbReady()) {
        const { data, error } = await window.RosellerSupabase
          .from('carts')
          .select('product_id, qty')
          .eq('user_id', uid());
        if (error) { console.error('[cart getItems]', error); return readLocal(); }
        const products = window.ROSELLER_PRODUCTS || [];
        return (data || []).map(r => {
          const p = products.find(x => x.id === r.product_id);
          return p ? { ...p, qty: r.qty }
                   : { id: r.product_id, name: '(unknown)', price: 0, image: '', qty: r.qty };
        });
      }
      return readLocal();
    },

    getItemsLocal() { return readLocal(); },

    /* Fire-and-forget add. Resolves as soon as the DB write is dispatched. */
    add(product, qty = 1) {
      if (authReady() && sbReady()) {
        const client = window.RosellerSupabase;
        const user_id = uid();
        return (async () => {
          const { data: existing } = await client
            .from('carts')
            .select('id, qty')
            .eq('user_id', user_id)
            .eq('product_id', product.id)
            .maybeSingle();
          if (existing) {
            await client.from('carts').update({ qty: existing.qty + qty }).eq('id', existing.id);
          } else {
            await client.from('carts').insert({ user_id, product_id: product.id, qty });
          }
          document.dispatchEvent(new CustomEvent('cart:updated'));
        })();
      }
      /* local fallback */
      const items = readLocal();
      const ex = items.find(i => i.id === product.id);
      if (ex) ex.qty += qty;
      else items.push({
        id: product.id, name: product.name,
        price: product.price || 0, image: product.image, qty
      });
      writeLocal(items);
      return Promise.resolve();
    },

    remove(productId) {
      if (authReady() && sbReady()) {
        return window.RosellerSupabase
          .from('carts').delete()
          .eq('user_id', uid()).eq('product_id', productId)
          .then(() => document.dispatchEvent(new CustomEvent('cart:updated')));
      }
      writeLocal(readLocal().filter(i => i.id !== productId));
      return Promise.resolve();
    },

    setQty(productId, qty) {
      const n = Math.max(1, parseInt(qty, 10) || 1);
      if (authReady() && sbReady()) {
        return window.RosellerSupabase
          .from('carts').update({ qty: n })
          .eq('user_id', uid()).eq('product_id', productId)
          .then(() => document.dispatchEvent(new CustomEvent('cart:updated')));
      }
      const items = readLocal();
      const it = items.find(i => i.id === productId);
      if (it) { it.qty = n; writeLocal(items); }
      return Promise.resolve();
    },

    clear() {
      if (authReady() && sbReady()) {
        return window.RosellerSupabase
          .from('carts').delete().eq('user_id', uid())
          .then(() => document.dispatchEvent(new CustomEvent('cart:updated')));
      }
      writeLocal([]);
      return Promise.resolve();
    }
  };

  /* ============================================================
     Header badge render
     ============================================================ */
  let seq = 0;
  async function render() {
    const my = ++seq;
    let items;
    try { items = await Cart.getItems(); }
    catch { items = readLocal(); }
    if (my !== seq) return;

    const count = items.reduce((s, i) => s + i.qty, 0);
    setBadge(count);

    const body = document.getElementById('cart-preview-items');
    if (!body) return;
    if (!items.length) { body.innerHTML = '<p class="cart-empty">Your cart is empty.</p>'; return; }
    body.innerHTML = items.slice(0, 4).map(it => `
      <div class="cart-item">
        <img src="${it.image || ''}" alt="">
        <div class="cart-item-info">
          <h5>${it.name || it.id}</h5>
          <p>Qty ${it.qty} · ৳${((it.price || 0) * it.qty).toLocaleString('en-BD')}</p>
        </div>
      </div>`).join('') +
      (items.length > 4 ? `<p class="cart-empty">+${items.length - 4} more…</p>` : '');
  }

  function setBadge(count) {
    const b  = document.getElementById('cart-count');
    const bM = document.getElementById('cart-count-mobile');
    const pC = document.getElementById('cart-preview-count');
    if (b)  b.textContent = count;
    if (bM) bM.textContent = count;
    if (pC) pC.textContent = count + (count === 1 ? ' item' : ' items');
  }

  /* ============================================================
     "Add to cart" — instant UI, background DB
     ============================================================ */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-add-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-add-id');
    const prod = (window.ROSELLER_PRODUCTS || []).find(p => p.id === id);
    if (!prod) return;

    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = '✓ Added';

    /* Optimistic header count */
    const cur = parseInt(document.getElementById('cart-count')?.textContent || '0', 10) || 0;
    setBadge(cur + 1);

    Cart.add(prod, 1).catch(err => {
      console.error('[cart] add failed', err);
      setBadge(Math.max(0, cur));
    });

    setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 1200);
  });

  /* ============================================================
     Local changes from cart-page (instant, no DB call)
     ============================================================ */
  document.addEventListener('cart:local-count', e => {
    if (typeof e.detail?.count === 'number') setBadge(e.detail.count);
  });

  /* ============================================================
     Events
     ============================================================ */
  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('partials:loaded', render);
  document.addEventListener('cart:updated', render);
  document.addEventListener('auth:changed', () => render());

  const readyCheck = setInterval(() => {
    if (window.RosellerSupabase) { clearInterval(readyCheck); render(); }
  }, 100);

  window.RosellerCart = Cart;
})();