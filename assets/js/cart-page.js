// ============================================================
// Roseller — cart-page.js (v4, optimistic)
// ============================================================
import { supabase } from './supabase.js';

const wrap = document.getElementById('cart-items');
if (!wrap) throw new Error('cart-items not found');

const emptyCol   = document.getElementById('cart-empty');
const summaryCol = document.getElementById('cart-summary-col');
const line       = document.getElementById('cart-summary-line');

const DELIVERY_FEE = (window.ROSELLER?.delivery?.fee) ?? 60;
const FREE_MIN     = (window.ROSELLER?.delivery?.freeMin) ?? 5000;
const fmt = n => '৳' + Number(n || 0).toLocaleString('en-BD');

async function currentUser() {
  if (!window.RosellerAuth) return null;
  await window.RosellerAuth.onReady();
  return window.RosellerAuth.currentUser;
}

async function getItems() {
  const user = await currentUser();
  if (!user) {
    return window.RosellerCart ? window.RosellerCart.getItemsLocal() : [];
  }
  const { data, error } = await supabase
    .from('carts').select('product_id, qty').eq('user_id', user.uid);
  if (error) { console.error('[cart-page] read', error); return []; }
  const products = window.ROSELLER_PRODUCTS || [];
  return (data || []).map(r => {
    const p = products.find(x => x.id === r.product_id);
    return p ? { ...p, qty: r.qty }
             : { id: r.product_id, name: '(unknown)', price: 0, image: '', qty: r.qty };
  });
}

function renderSummaryTotals(sub, del) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('summary-subtotal', fmt(sub));
  set('summary-delivery', del === 0 ? 'FREE' : fmt(del));
  set('summary-total',    fmt(sub + del));
}

/* Recalculate everything visible in the DOM — no DB round-trip */
function recalcFromDOM() {
  const cards = wrap.querySelectorAll('.cart-card');
  let sub = 0, totalQty = 0;
  cards.forEach(card => {
    const qty = parseInt(card.querySelector('.qty-input').value, 10) || 0;
    const priceText = card.querySelector('.cart-card-price')?.textContent || '0';
    const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
    sub += qty * price;
    totalQty += qty;
  });
  const del = sub >= FREE_MIN ? 0 : DELIVERY_FEE;
  renderSummaryTotals(sub, del);

  if (line) line.textContent = `${totalQty} item${totalQty !== 1 ? 's' : ''} in your cart.`;

  /* Notify header badge instantly */
  document.dispatchEvent(new CustomEvent('cart:local-count', { detail: { count: totalQty } }));
}

async function render() {
  let items = [];
  try { items = await getItems(); }
  catch (e) { console.error('[cart-page] getItems', e); }

  if (!items.length) {
    wrap.innerHTML = '';
    emptyCol   && emptyCol.classList.remove('hidden');
    summaryCol && summaryCol.classList.add('hidden');
    if (line) line.textContent = 'Your cart is empty.';
    renderSummaryTotals(0, 0);
    document.dispatchEvent(new CustomEvent('cart:local-count', { detail: { count: 0 } }));
    return;
  }

  emptyCol   && emptyCol.classList.add('hidden');
  summaryCol && summaryCol.classList.remove('hidden');

  wrap.innerHTML = items.map(it => `
    <article class="cart-card" data-id="${it.id}">
      <a href="product.html?id=${it.id}" class="cart-card-media">
        <img src="${it.image || ''}" alt="${it.name || ''}">
      </a>
      <div class="cart-card-body">
        <h3 class="cart-card-title"><a href="product.html?id=${it.id}">${it.name || it.id}</a></h3>
        <div class="cart-card-sku">${it.id}</div>
        <div class="cart-card-price">${fmt(it.price)}</div>
        <div class="cart-card-controls">
          <div class="qty-control">
            <button type="button" class="qty-btn" data-qty="-1">−</button>
            <input type="number" class="qty-input" value="${it.qty}" min="1" max="99" inputmode="numeric">
            <button type="button" class="qty-btn" data-qty="1">+</button>
          </div>
          <button type="button" class="remove-btn" data-remove>Remove</button>
        </div>
      </div>
    </article>`).join('');

  recalcFromDOM();
  wireCards();
}

function wireCards() {
  wrap.querySelectorAll('.cart-card').forEach(card => {
    const id = card.getAttribute('data-id');
    const input = card.querySelector('.qty-input');

    /* Debounced DB write — 350ms of quiet time */
    let writeTimer = null;
    const scheduleWrite = (n) => {
      if (writeTimer) clearTimeout(writeTimer);
      writeTimer = setTimeout(() => {
        if (window.RosellerCart) {
          window.RosellerCart.setQty(id, n).catch(err =>
            console.error('[cart-page] setQty failed', err));
        }
      }, 350);
    };

    const setQty = (raw) => {
      let n = parseInt(raw, 10);
      if (isNaN(n) || n < 1) n = 1;
      if (n > 99) n = 99;
      input.value = n;
      recalcFromDOM();
      scheduleWrite(n);
    };

    card.querySelectorAll('[data-qty]').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.getAttribute('data-qty'), 10);
        const newQty = Math.max(1, Math.min(99, parseInt(input.value, 10) + delta));
        setQty(newQty);
      });
    });

    input.addEventListener('change', () => setQty(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    });

    const removeBtn = card.querySelector('[data-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        card.style.opacity = '0.4';
        card.style.pointerEvents = 'none';
        if (window.RosellerCart) {
          window.RosellerCart.remove(id).catch(err => {
            console.error('[cart-page] remove failed', err);
            card.style.opacity = '1';
            card.style.pointerEvents = '';
          });
        }
      });
    }
  });
}

/* Clear cart button */
document.addEventListener('click', e => {
  if (e.target.id === 'clear-cart-btn') {
    if (!confirm('Remove all items from your cart?')) return;
    if (window.RosellerCart) window.RosellerCart.clear();
  }
});

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