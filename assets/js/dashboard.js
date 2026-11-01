// ============================================================
// Roseller — dashboard.js (v2)
// User account area: overview, orders, wishlist, cart, profile
// ============================================================
import { supabase } from './supabase.js';

const root = document.getElementById('account-root');
const fmt   = n => '৳' + Number(n || 0).toLocaleString('en-BD');
const fmtDt = s => s ? new Date(s).toLocaleString('en-BD', { dateStyle:'medium', timeStyle:'short' }) : '—';
const initials = name => (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

let currentTab = 'overview';
let profile = null;

/* ============================================================
   INIT
   ============================================================ */
async function init() {
  if (!window.RosellerAuth) return;
  await window.RosellerAuth.onReady();

  /* Honour #overview / #orders / #wishlist / #cart / #profile in the URL */
  const hash = (location.hash || '').replace('#', '').toLowerCase();
  if (['overview', 'orders', 'wishlist', 'cart', 'profile'].includes(hash)) {
    currentTab = hash;
  }

  if (!window.RosellerAuth.currentUser) return renderLogin();

  const user = window.RosellerAuth.currentUser;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.uid)
    .maybeSingle();

  if (!data) {
    root.innerHTML = `<div class="account-empty">
      <div class="em-icon">⚠️</div>
      <h2>Profile is not varifed</h2>
      <p>Your account is waiting for approval. Please allow us sometime. We will review your request as soon as possible.</p>
      <p style="font-size:11.5px;color:#9ca3af;margin-top:8px;">User ID: ${user.uid}</p>
      <button class="btn-secondary" id="logout-empty" style="margin-top:16px;">Sign out</button>
    </div>`;
    document.getElementById('logout-empty').onclick = () => window.RosellerAuth.logout().then(() => location.reload());
    return;
  }

  if (!data.is_approved) {
    root.innerHTML = `<div class="account-empty">
      <div class="em-icon">⏳</div>
      <h2>Account Pending Approval</h2>
      <p>Please wait for admin approval before you can place orders.</p>
      <p style="font-size:11.5px;color:#9ca3af;margin-top:8px;">User ID: ${user.uid}</p>
      <button class="btn-secondary" id="logout-pending" style="margin-top:16px;">Sign out</button>
    </div>`;
    document.getElementById('logout-pending').onclick = () => window.RosellerAuth.logout().then(() => location.reload());
    return;
  }

  profile = data;
  renderShell();
}

function renderLogin() {
  root.innerHTML = `<div class="account-empty">
    <div class="em-icon">👤</div>
    <h2>Sign in required</h2>
    <p>Sign in with Google to access your orders, wishlist, and cart.</p>
    <button class="btn-primary" id="dash-login" style="margin-top:16px;">Sign in with Google</button>
  </div>`;
  document.getElementById('dash-login').onclick = () => window.RosellerAuth.login();
}

/* ============================================================
   SHELL (sidebar + content wrapper)
   ============================================================ */
function renderShell() {
  const user = window.RosellerAuth.currentUser;
  const avatar = user.photoURL
    ? `<img class="account-avatar" src="${user.photoURL}" alt="">`
    : `<div class="account-avatar">${initials(profile.full_name || profile.email)}</div>`;

  root.innerHTML = `
    <div class="account-layout">
      <aside class="account-sidebar">
        <div class="account-sidebar-user">
          ${avatar}
          <div style="min-width:0;">
            <strong>${profile.full_name || 'Account'}</strong>
            <span>${profile.email || ''}</span>
          </div>
        </div>
        <nav class="account-nav">
          <button class="account-nav-btn ${currentTab==='overview'?'active':''}" data-tab="overview"><span class="ac-icon">📊</span>Overview</button>
          <button class="account-nav-btn ${currentTab==='orders'?'active':''}"   data-tab="orders"><span class="ac-icon">📦</span>Orders</button>
          <button class="account-nav-btn ${currentTab==='wishlist'?'active':''}" data-tab="wishlist"><span class="ac-icon">💝</span>Wishlist</button>
          <button class="account-nav-btn ${currentTab==='cart'?'active':''}"     data-tab="cart"><span class="ac-icon">🛒</span>Cart</button>
          <button class="account-nav-btn ${currentTab==='profile'?'active':''}"  data-tab="profile"><span class="ac-icon">👤</span>Profile</button>
        </nav>
        <button class="account-nav-btn account-nav-signout" id="account-logout"><span class="ac-icon">↪</span>Sign out</button>
      </aside>
      <section class="account-content" id="account-content"></section>
    </div>`;

  root.querySelectorAll('[data-tab]').forEach(b => {
    b.onclick = () => {
      currentTab = b.dataset.tab;
      /* Keep URL hash in sync so refresh preserves the tab */
      if (['overview', 'orders', 'wishlist', 'cart', 'profile'].includes(currentTab)) {
        if (location.hash !== '#' + currentTab) {
          history.replaceState(null, '', '#' + currentTab);
        }
      }
      renderShell();
    };
  });
  document.getElementById('account-logout').onclick = () =>
    window.RosellerAuth.logout().then(() => location.reload());

  renderTab();
}

function renderTab() {
  const el = document.getElementById('account-content');
  if (!el) return;
  if (currentTab === 'overview') return renderOverview(el);
  if (currentTab === 'orders')   return renderOrders(el);
  if (currentTab === 'wishlist') return renderWishlist(el);
  if (currentTab === 'cart')     return renderCart(el);
  if (currentTab === 'profile')  return renderProfile(el);
}

/* ============================================================
   OVERVIEW
   ============================================================ */
async function renderOverview(el) {
  el.innerHTML = `
    <h1>Welcome, ${(profile.full_name || 'there').split(' ')[0]}!</h1>
    <p class="sub">Here's a snapshot of your account</p>
    <div class="stat-mini-row" id="mini-stats"><div class="muted" style="grid-column:1/-1;">Loading…</div></div>
    <h2 style="font-size:15px;font-weight:700;margin:20px 0 12px;">Recent Orders</h2>
    <div id="recent-orders"><div class="muted">Loading…</div></div>`;

  const [ordersRes, wishRes, cartRes] = await Promise.all([
    supabase.from('orders').select('*, order_items(*)').eq('user_id', profile.id).order('created_at', { ascending:false }).limit(10),
    supabase.from('wishlists').select('product_id').eq('user_id', profile.id),
    supabase.from('carts').select('qty').eq('user_id', profile.id)
  ]);

  const orders = ordersRes.data || [];
  const wishCount = (wishRes.data || []).length;
  const cartCount = (cartRes.data || []).reduce((s, r) => s + r.qty, 0);

  document.getElementById('mini-stats').innerHTML = `
    <div class="stat-mini">
      <div class="stat-mini-label">Total Orders</div>
      <div class="stat-mini-value">${orders.length}</div>
    </div>
    <div class="stat-mini amber">
      <div class="stat-mini-label">Pending</div>
      <div class="stat-mini-value">${orders.filter(o => o.status === 'pending').length}</div>
    </div>
    <div class="stat-mini purple">
      <div class="stat-mini-label">Wishlist</div>
      <div class="stat-mini-value">${wishCount}</div>
    </div>
    <div class="stat-mini green">
      <div class="stat-mini-label">In Cart</div>
      <div class="stat-mini-value">${cartCount}</div>
    </div>`;

  const box = document.getElementById('recent-orders');
  const recent = orders.slice(0, 3);
  box.innerHTML = recent.length
    ? recent.map(o => orderCard(o, true)).join('')
    : `<div class="account-empty" style="padding:32px;">
         <div class="em-icon">📦</div>
         <p style="margin:8px 0;">No orders yet.</p>
         <a href="products.html" style="color:var(--primary);font-weight:600;">Start shopping</a>
       </div>`;
}

/* ============================================================
   ORDERS
   ============================================================ */
async function renderOrders(el) {
  el.innerHTML = `<h1>My Orders</h1><p class="sub">All orders placed from this account</p><div id="orders-list"><div class="muted" style="padding:20px;text-align:center;">Loading orders…</div></div>`;

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const box = document.getElementById('orders-list');
  if (error) { box.innerHTML = `<div class="card">${error.message}</div>`; return; }
  if (!data?.length) {
    box.innerHTML = `<div class="account-empty">
      <div class="em-icon">📦</div>
      <h2>No orders yet</h2>
      <p>When you place an order, it will appear here.</p>
      <a href="products.html" class="btn-primary" style="margin-top:16px;display:inline-block;">Browse Products</a>
    </div>`;
    return;
  }
  box.innerHTML = data.map(o => orderCard(o, true)).join('');
}

function orderCard(o, showActions = false) {
  const STATUS = {
    pending:   { label: 'Pending',   color: '#f59e0b', bg: '#fef3c7' },
    confirmed: { label: 'Confirmed', color: '#1e40af', bg: '#dbeafe' },
    shipped:   { label: 'Shipped',   color: '#6d28d9', bg: '#ede9fe' },
    delivered: { label: 'Delivered', color: '#065f46', bg: '#d1fae5' },
    cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' }
  };
  const s = STATUS[o.status] || { label: o.status, color: '#6b7280', bg: '#f3f4f6' };
  const items = o.order_items || [];
  const firstItem = items[0];
  const extraCount = items.length - 1;

  const thumb = firstItem?.image
    ? `<img src="${firstItem.image}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:#fafafa;flex-shrink:0;">`
    : `<div style="width:64px;height:64px;border-radius:8px;background:linear-gradient(135deg,#e53935,#c62828);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;flex-shrink:0;">📦</div>`;

  const btn =
    o.status === 'delivered'
      ? `<a href="track-order.html?order=${encodeURIComponent(o.order_number)}"
            style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:12.5px;font-weight:700;text-decoration:none;color:#fff;background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 12px rgba(16,185,129,.3);transition:transform .15s,box-shadow .15s;"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(16,185,129,.4)'"
            onmouseout="this.style.transform='';this.style.boxShadow='0 4px 12px rgba(16,185,129,.3)'">✓ View Details</a>`
      : o.status === 'shipped'
      ? `<a href="track-order.html?order=${encodeURIComponent(o.order_number)}"
            style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:12.5px;font-weight:700;text-decoration:none;color:#fff;background:linear-gradient(135deg,#8b5cf6,#6d28d9);box-shadow:0 4px 12px rgba(139,92,246,.3);transition:transform .15s,box-shadow .15s;"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(139,92,246,.4)'"
            onmouseout="this.style.transform='';this.style.boxShadow='0 4px 12px rgba(139,92,246,.3)'">🚚 Track Order</a>`
      : `<a href="track-order.html?order=${encodeURIComponent(o.order_number)}"
            style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:8px;font-size:12.5px;font-weight:700;text-decoration:none;color:#fff;background:linear-gradient(135deg,#e53935,#c62828);box-shadow:0 4px 12px rgba(229,57,53,.3);transition:transform .15s,box-shadow .15s;"
            onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 18px rgba(229,57,53,.4)'"
            onmouseout="this.style.transform='';this.style.boxShadow='0 4px 12px rgba(229,57,53,.3)'">Track Order</a>`;

  return `
    <div class="order-history-card" style="padding:14px;">
      <div style="display:flex;gap:14px;align-items:flex-start;">

        ${thumb}

        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <div style="min-width:0;">
              <h3 style="margin:0;font-size:13.5px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:.3px;">
                ${o.order_number}
              </h3>
              <div style="font-size:11.5px;color:var(--muted);margin-top:2px;">
                ${fmtDt(o.created_at)} · ${(o.payment_method || 'COD').toUpperCase()}
              </div>
            </div>
            <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;color:${s.color};background:${s.bg};white-space:nowrap;">
              ${s.label}
            </span>
          </div>

          <div style="font-size:12.5px;color:var(--muted);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${firstItem ? firstItem.product_name + ' × ' + firstItem.qty : 'No items'}
            ${extraCount > 0 ? `<span style="color:#e53935;font-weight:600;"> +${extraCount} more</span>` : ''}
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--line);">
            <div style="font-size:12px;color:var(--muted);">
              Total <strong style="color:#e53935;font-size:15px;margin-left:4px;">${fmt(o.total)}</strong>
            </div>
            ${showActions ? btn : ''}
          </div>
        </div>
      </div>
    </div>`;
}




/* ============================================================
   WISHLIST
   ============================================================ */
async function renderWishlist(el) {
  el.innerHTML = `<h1>My Wishlist</h1><p class="sub">Products you've saved for later</p><div id="wishlist-list"><div class="muted">Loading…</div></div>`;

  const { data: rows, error } = await supabase
    .from('wishlists')
    .select('product_id, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const box = document.getElementById('wishlist-list');
  if (error) { box.innerHTML = `<div class="card">${error.message}</div>`; return; }

  const products = window.ROSELLER_PRODUCTS || [];
  const items = (rows || []).map(r => products.find(p => p.id === r.product_id)).filter(Boolean);

  if (!items.length) {
    box.innerHTML = `<div class="account-empty">
      <div class="em-icon">💝</div>
      <h2>Your wishlist is empty</h2>
      <p>Tap the heart on any product to save it here.</p>
      <a href="products.html" class="btn-primary" style="margin-top:16px;display:inline-block;">Browse Products</a>
    </div>`;
    return;
  }

  box.innerHTML = `<div class="product-grid">${items.map(p => window.RosellerCard(p)).join('')}</div>`;

  box.querySelectorAll('[data-wishlist-toggle]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      const id = btn.getAttribute('data-wishlist-toggle');
      if (window.RosellerWishlistDB) await window.RosellerWishlistDB.toggle(id);
      renderTab();
    });
  });

  box.querySelectorAll('[data-add-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-add-id');
      const p = products.find(x => x.id === id);
      if (p && window.RosellerCartDB) await window.RosellerCartDB.add(p, 1);
      btn.textContent = '✓ Added';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = 'Add to Cart'; btn.disabled = false; }, 1200);
    });
  });
}

/* ============================================================
   CART
   ============================================================ */
async function renderCart(el) {
  el.innerHTML = `<h1>My Cart</h1><p class="sub">Items you're planning to buy</p><div id="cart-list"><div class="muted">Loading…</div></div>`;

  const { data: rows, error } = await supabase
    .from('carts')
    .select('product_id, qty')
    .eq('user_id', profile.id);

  const box = document.getElementById('cart-list');
  if (error) { box.innerHTML = `<div class="card">${error.message}</div>`; return; }

  const products = window.ROSELLER_PRODUCTS || [];
  const items = (rows || []).map(r => {
    const p = products.find(x => x.id === r.product_id);
    return p ? { ...p, qty: r.qty } : null;
  }).filter(Boolean);

  if (!items.length) {
    box.innerHTML = `<div class="account-empty">
      <div class="em-icon">🛒</div>
      <h2>Your cart is empty</h2>
      <p>Browse products and add items to your cart.</p>
      <a href="products.html" class="btn-primary" style="margin-top:16px;display:inline-block;">Browse Products</a>
    </div>`;
    return;
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = subtotal >= 5000 ? 0 : 60;
  const total    = subtotal + delivery;

  box.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;">
      ${items.map(i => `
        <div class="order-history-card">
          <div style="display:flex;gap:14px;align-items:center;">
            <img src="${i.image}" alt="" style="width:70px;height:70px;object-fit:contain;border:1px solid var(--line);border-radius:6px;background:#fafafa;padding:6px;">
            <div style="flex:1;min-width:0;">
              <h3 style="margin:0 0 4px;font-size:14px;">${i.name}</h3>
              <div class="oh-meta">${fmt(i.price)} each</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="qty-control" style="height:36px;">
                <button class="qty-btn" data-qty-minus="${i.id}">−</button>
                <input type="number" class="qty-input" data-qty-input="${i.id}" value="${i.qty}" min="1" max="99" inputmode="numeric" style="width:52px;">
                <button class="qty-btn" data-qty-plus="${i.id}">+</button>
              </div>
              <button class="remove-btn" data-remove="${i.id}">Remove</button>
            </div>
          </div>
          <div class="oh-total" style="margin-top:10px;">
            <span>Subtotal</span>
            <strong>${fmt(i.price * i.qty)}</strong>
          </div>
        </div>`).join('')}
    </div>

    <div class="cart-summary" style="margin-top:20px;max-width:400px;">
      <h2 style="margin:0 0 12px;font-size:16px;">Summary</h2>
      <div class="summary-row"><span>Subtotal</span><strong id="dash-sub">${fmt(subtotal)}</strong></div>
      <div class="summary-row"><span>Delivery</span><strong id="dash-del">${delivery === 0 ? 'FREE' : fmt(delivery)}</strong></div>
      <div class="summary-row summary-row--total"><span>Total</span><strong id="dash-total">${fmt(total)}</strong></div>
      <a href="checkout.html" class="btn-checkout" style="margin-top:14px;">Proceed to Checkout</a>
      <a href="products.html" class="summary-continue" style="margin-top:6px;">Continue Shopping</a>
    </div>`;

  /* Recompute totals from what's in the DOM */
  const recompute = () => {
    let sub = 0;
    box.querySelectorAll('[data-qty-input]').forEach(inp => {
      const rowCard = inp.closest('.order-history-card');
      const priceText = rowCard.querySelector('.oh-meta')?.textContent || '0';
      const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;
      sub += (parseInt(inp.value, 10) || 0) * price;
    });
    const del = sub >= 5000 ? 0 : 60;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('dash-sub', fmt(sub));
    set('dash-del', del === 0 ? 'FREE' : fmt(del));
    set('dash-total', fmt(sub + del));
  };

  box.querySelectorAll('[data-qty-plus]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.qtyPlus;
      const inp = box.querySelector(`[data-qty-input="${id}"]`);
      const n = Math.min(99, (parseInt(inp.value, 10) || 1) + 1);
      inp.value = n;
      recompute();
      if (window.RosellerCartDB) await window.RosellerCartDB.setQty(id, n);
    };
  });

  box.querySelectorAll('[data-qty-minus]').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.qtyMinus;
      const inp = box.querySelector(`[data-qty-input="${id}"]`);
      const n = Math.max(1, (parseInt(inp.value, 10) || 1) - 1);
      inp.value = n;
      recompute();
      if (window.RosellerCartDB) await window.RosellerCartDB.setQty(id, n);
    };
  });

  /* Manual input */
  box.querySelectorAll('[data-qty-input]').forEach(inp => {
    let timer = null;
    const commit = () => {
      const id = inp.dataset.qtyInput;
      let n = parseInt(inp.value, 10);
      if (isNaN(n) || n < 1) n = 1;
      if (n > 99) n = 99;
      inp.value = n;
      recompute();
      if (window.RosellerCartDB) window.RosellerCartDB.setQty(id, n).catch(err => {
        console.error('[dashboard cart] setQty', err);
      });
    };
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    });
    inp.addEventListener('input', () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(commit, 350);
    });
  });

  box.querySelectorAll('[data-remove]').forEach(b => {
    b.onclick = async () => {
      const card = b.closest('.order-history-card');
      if (card) {
        card.style.opacity = '0.4';
        card.style.pointerEvents = 'none';
      }
      const id = b.dataset.remove;
      if (window.RosellerCartDB) {
        window.RosellerCartDB.remove(id).catch(err => {
          console.error('[dashboard cart] remove', err);
          if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; }
        });
      }
    };
  });
}

/* ============================================================
   PROFILE
   ============================================================ */
async function renderProfile(el) {
  el.innerHTML = `
    <h1>My Profile</h1>
    <p class="sub">Update your contact details</p>
    <form class="profile-form" id="profile-form">
      <div class="form-row">
        <label for="pf-name">Full Name</label>
        <input id="pf-name" type="text" value="${profile.full_name || ''}" placeholder="Your name">
      </div>
      <div class="form-row">
        <label for="pf-phone">Phone</label>
        <input id="pf-phone" type="tel" value="${profile.phone || ''}" placeholder="e.g. 01700-000000">
      </div>
      <div class="form-row">
        <label for="pf-email">Email (from Google)</label>
        <input id="pf-email" type="email" value="${profile.email || ''}" disabled style="background:#f5f5f5;color:#6b7280;">
      </div>
      <div class="form-row">
        <label for="pf-address">Address</label>
        <textarea id="pf-address" rows="3" placeholder="House, Road, Area">${profile.address || ''}</textarea>
      </div>
      <div class="form-row">
        <label for="pf-city">City / District</label>
        <input id="pf-city" type="text" value="${profile.city || ''}" placeholder="e.g. Dhaka">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-primary">Save Changes</button>
      </div>
    </form>`;

  const form = document.getElementById('profile-form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name    = document.getElementById('pf-name').value.trim();
    const phone   = document.getElementById('pf-phone').value.trim();
    const address = document.getElementById('pf-address').value.trim();
    const city    = document.getElementById('pf-city').value.trim();

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, phone, address, city })
      .eq('id', profile.id);

    if (error) { alert('Failed: ' + error.message); return; }

    profile.full_name = name;
    profile.phone = phone;
    profile.address = address;
    profile.city = city;
    alert('Profile updated.');
    renderShell();
  });
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', init);

/* React to #orders / #wishlist / #cart / #profile hash changes
   without a full page reload */
window.addEventListener('hashchange', () => {
  const hash = (location.hash || '').replace('#', '').toLowerCase();
  if (['overview', 'orders', 'wishlist', 'cart', 'profile'].includes(hash)) {
    currentTab = hash;
    if (profile) renderShell();
  }
});