// ============================================================
// Roseller — wishlist.js (v3, optimistic)
// ============================================================
(function () {
  'use strict';

  const KEY = 'roseller_wishlist_v1';

  function readLocal() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }
  function writeLocal(ids) {
    localStorage.setItem(KEY, JSON.stringify(ids));
    document.dispatchEvent(new CustomEvent('wishlist:updated'));
  }

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
     Wishlist API
     ============================================================ */
  const Wishlist = {
    async getIds() {
      if (authReady() && sbReady()) {
        const { data, error } = await window.RosellerSupabase
          .from('wishlists').select('product_id').eq('user_id', uid());
        if (error) { console.error('[wishlist getIds]', error); return readLocal(); }
        return (data || []).map(r => r.product_id);
      }
      return readLocal();
    },

    getIdsLocal() { return readLocal(); },

    async has(id) { return (await this.getIds()).includes(id); },

    /* Fire-and-forget toggle */
    toggle(id) {
      if (authReady() && sbReady()) {
        const client = window.RosellerSupabase;
        const user_id = uid();
        return (async () => {
          const { data: existing } = await client
            .from('wishlists').select('id')
            .eq('user_id', user_id).eq('product_id', id)
            .maybeSingle();
          if (existing) {
            await client.from('wishlists').delete().eq('id', existing.id);
            document.dispatchEvent(new CustomEvent('wishlist:updated'));
            return false;
          }
          await client.from('wishlists').insert({ user_id, product_id: id });
          document.dispatchEvent(new CustomEvent('wishlist:updated'));
          return true;
        })();
      }
      const ids = readLocal();
      const idx = ids.indexOf(id);
      if (idx !== -1) ids.splice(idx, 1);
      else ids.push(id);
      writeLocal(ids);
      return Promise.resolve(idx === -1);
    },

    add(id) {
      const current = this.getIdsLocal();
      if (current.includes(id)) return Promise.resolve();
      return this.toggle(id);
    },

    remove(id) {
      const current = this.getIdsLocal();
      if (!current.includes(id)) return Promise.resolve();
      return this.toggle(id);
    },

    clear() {
      if (authReady() && sbReady()) {
        return window.RosellerSupabase
          .from('wishlists').delete().eq('user_id', uid())
          .then(() => document.dispatchEvent(new CustomEvent('wishlist:updated')));
      }
      writeLocal([]);
      return Promise.resolve();
    }
  };

  /* ============================================================
     Header badge
     ============================================================ */
  let seq = 0;
  async function renderBadge() {
    const my = ++seq;
    const ids = await Wishlist.getIds();
    if (my !== seq) return;
    setBadge(ids.length);
  }

  function setBadge(n) {
    const b  = document.getElementById('wishlist-count');
    const bM = document.getElementById('wishlist-count-mobile');
    if (b)  { b.textContent = n; b.classList.toggle('is-active', n > 0); }
    if (bM) bM.textContent = n;
  }

  async function syncHearts() {
    const ids = await Wishlist.getIds();
    const set = new Set(ids);
    document.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
      const id = btn.getAttribute('data-wishlist-toggle');
      const active = set.has(id);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ============================================================
     Click — instant UI, background DB
     ============================================================ */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-wishlist-toggle]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    const id = btn.getAttribute('data-wishlist-toggle');
    const wasActive = btn.classList.contains('is-active');
    const nowActive = !wasActive;

    /* 1. Flip button instantly */
    btn.classList.toggle('is-active', nowActive);
    btn.setAttribute('aria-pressed', nowActive ? 'true' : 'false');
    btn.style.transform = 'scale(1.3)';
    setTimeout(() => { btn.style.transform = ''; }, 180);

    /* 2. Optimistic header count */
    const cur = parseInt(document.getElementById('wishlist-count')?.textContent || '0', 10) || 0;
    setBadge(Math.max(0, cur + (nowActive ? 1 : -1)));

    /* 3. Background DB write with rollback */
    Wishlist.toggle(id).catch(err => {
      console.error('[wishlist] toggle failed', err);
      btn.classList.toggle('is-active', wasActive);
      btn.setAttribute('aria-pressed', wasActive ? 'true' : 'false');
      setBadge(Math.max(0, cur));
    });
  }, true);

  /* ============================================================
     Events
     ============================================================ */
  async function refresh() { await renderBadge(); await syncHearts(); }
  document.addEventListener('DOMContentLoaded', refresh);
  document.addEventListener('partials:loaded', refresh);
  document.addEventListener('wishlist:updated', refresh);
  document.addEventListener('auth:changed', () => refresh());

  const readyCheck = setInterval(() => {
    if (window.RosellerSupabase) { clearInterval(readyCheck); refresh(); }
  }, 100);

  /* Mutation observer for new cards */
  let raf;
  const obs = new MutationObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(syncHearts);
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(
      '.product-grid, #all-products-grid, #category-grid, #search-results-grid, #wishlist-grid'
    ).forEach(g => obs.observe(g, { childList: true, subtree: true }));
  });

  window.RosellerWishlist = Wishlist;
})();