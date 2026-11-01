// ============================================================
// Roseller — wishlist-page.js (v3, optimistic)
// ============================================================
import { supabase } from './supabase.js';

const grid  = document.getElementById('wishlist-grid');
const empty = document.getElementById('wishlist-empty');
const line  = document.getElementById('wishlist-summary-line');
if (!grid) throw new Error('wishlist-grid not found');

async function currentUser() {
  if (!window.RosellerAuth) return null;
  await window.RosellerAuth.onReady();
  return window.RosellerAuth.currentUser;
}

async function getIds() {
  const user = await currentUser();
  if (!user) return window.RosellerWishlist ? window.RosellerWishlist.getIdsLocal() : [];
  const { data, error } = await supabase
    .from('wishlists').select('product_id').eq('user_id', user.uid);
  if (error) { console.error('[wishlist-page] read', error); return []; }
  return (data || []).map(r => r.product_id);
}

async function render() {
  const ids = await getIds();
  const products = window.ROSELLER_PRODUCTS || [];
  const items = ids.map(id => products.find(p => p.id === id)).filter(Boolean);

  if (!items.length) {
    grid.innerHTML = '';
    empty && empty.classList.remove('hidden');
    if (line) line.textContent = 'Your wishlist is empty.';
    return;
  }

  empty && empty.classList.add('hidden');
  grid.innerHTML = items.map(p => window.RosellerCard(p)).join('');
  if (line) line.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} saved for later.`;

  /* Heart removal — optimistic */
  grid.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute('data-wishlist-toggle');
      const wasActive = btn.classList.contains('is-active');
      btn.classList.toggle('is-active', !wasActive);

      if (window.RosellerWishlist) {
        window.RosellerWishlist.toggle(id).catch(err => {
          console.error('[wishlist-page] toggle failed', err);
          btn.classList.toggle('is-active', wasActive);
        });
      }
    });
  });

  /* Add to cart — instant feedback */
  grid.querySelectorAll('[data-add-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-add-id');
      const p = products.find(x => x.id === id);
      if (!p) return;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '✓ Added';
      if (window.RosellerCart) {
        window.RosellerCart.add(p, 1).catch(err => {
          console.error('[wishlist-page] add cart failed', err);
        });
      }
      setTimeout(() => { btn.disabled = false; btn.textContent = orig; }, 1200);
    });
  });
}

document.addEventListener('wishlist:updated', render);
document.addEventListener('cart:updated', render);
document.addEventListener('partials:loaded', render);
document.addEventListener('DOMContentLoaded', render);
document.addEventListener('auth:changed', render);

const readyCheck = setInterval(() => {
  if (window.RosellerSupabase && window.ROSELLER_PRODUCTS) {
    clearInterval(readyCheck);
    render();
  }
}, 100);

render();