// ============================================================
// Roseller — checkout-page.js (v3)
// COD-only checkout with profile autofill
// ============================================================
import { supabase } from './supabase.js';

(function () {
  'use strict';

  const form = document.getElementById('checkout-form');
  if (!form) return;

  const DELIVERY_FEE = (window.ROSELLER?.delivery?.fee) ?? 60;
  const FREE_MIN     = (window.ROSELLER?.delivery?.freeMin) ?? 5000;
  const fmt = n => '৳' + Number(n || 0).toLocaleString('en-BD');

  /* ============================================================
     Cart items for the summary
     ============================================================ */
  async function getCartItems() {
    if (window.RosellerCart) {
      try { return await window.RosellerCart.getItems(); }
      catch { return []; }
    }
    return [];
  }

  async function renderSummary() {
    const items = await getCartItems();
    const listEl = document.getElementById('checkout-items');
    if (!listEl) return;

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

    if (!items.length) {
      listEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      set('summary-subtotal', fmt(0));
      set('summary-delivery', fmt(0));
      set('summary-total', fmt(0));
      return;
    }

    listEl.innerHTML = items.map(it => `
      <div class="checkout-item">
        <img src="${it.image || ''}" alt="">
        <div class="checkout-item-info">
          <h5>${it.name || it.id}</h5>
          <p>Qty ${it.qty} × ${fmt(it.price)}</p>
        </div>
        <strong>${fmt(it.price * it.qty)}</strong>
      </div>`).join('');

    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const del = sub >= FREE_MIN ? 0 : DELIVERY_FEE;
    set('summary-subtotal', fmt(sub));
    set('summary-delivery', del === 0 ? 'FREE' : fmt(del));
    set('summary-total',    fmt(sub + del));
  }

  /* ============================================================
     Autofill from profile (only fills empty fields)
     ============================================================ */
  async function autofillFromProfile() {
    if (!window.RosellerAuth) return;
    await window.RosellerAuth.onReady();
    const user = window.RosellerAuth.currentUser;
    if (!user) return;

    const setVal = (id, val) => {
      if (!val) return;
      const el = document.getElementById(id);
      if (el && !el.value) el.value = val;
    };

    /* --- 1. Google account data (always available when signed in) --- */
    setVal('co-name',  user.displayName);
    setVal('co-email', user.email);

    /* --- 2. Profile data (overrides if a custom value exists) --- */
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, email, address, city')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile) {
      /* Only override name/email if the profile explicitly has them.
         If the user edited their name in Profile, use that.
         Otherwise fall back to Google's value (already set above). */
      const nameEl  = document.getElementById('co-name');
      const emailEl = document.getElementById('co-email');
      if (nameEl  && profile.full_name && profile.full_name !== user.displayName) nameEl.value  = profile.full_name;
      if (emailEl && profile.email     && profile.email     !== user.email)        emailEl.value = profile.email;

      setVal('co-phone',   profile.phone);
      setVal('co-address', profile.address);
      setVal('co-city',    profile.city);
    }
  }

  /* ============================================================
     Auth guard
     ============================================================ */
  async function requireUser() {
    if (!window.RosellerAuth) throw new Error('Auth not loaded');
    await window.RosellerAuth.onReady();
    if (!window.RosellerAuth.currentUser) {
      await window.RosellerAuth.login();
      await new Promise(r => window.RosellerAuth.onReady(r));
    }
    if (!window.RosellerAuth.currentUser) throw new Error('Login cancelled');
    return window.RosellerAuth.currentUser;
  }

  /* ============================================================
     Order number: RL-YYYYMMDD-XXXX
     ============================================================ */
  function genOrderNumber() {
    const d = new Date();
    const ymd = d.getFullYear().toString()
      + String(d.getMonth() + 1).padStart(2, '0')
      + String(d.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `RL-${ymd}-${rand}`;
  }

  /* ============================================================
     Submit — COD only
     ============================================================ */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const items = await getCartItems();
    if (!items.length) { alert('Your cart is empty.'); location.href = 'products.html'; return; }

    const btn = document.getElementById('place-order-btn');
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    try {
      const user = await requireUser();

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('id', user.uid)
        .maybeSingle();

      if (!profile || !profile.is_approved) {
        throw new Error('Your account is pending approval. Please wait for admin approval.');
      }

      const data = Object.fromEntries(new FormData(form).entries());

      const sub  = items.reduce((s, i) => s + i.price * i.qty, 0);
      const del  = sub >= FREE_MIN ? 0 : DELIVERY_FEE;
      const total = sub + del;

      const orderNumber = genOrderNumber();

      const { data: orderRow, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.uid,
          status: 'pending',
          payment_method: 'cod',
          subtotal: sub,
          delivery_fee: del,
          total,
          shipping_name: data.name,
          shipping_phone: data.phone,
          shipping_address: data.address,
          shipping_city: data.city,
          notes: data.notes || null
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      const itemRows = items.map(it => ({
        order_id: orderRow.id,
        product_id: it.id,
        product_name: it.name,
        price: it.price,
        qty: it.qty,
        image: it.image || null
      }));
      const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
      if (itemsErr) throw itemsErr;

      await supabase.from('tracking_events').insert({
        order_id: orderRow.id,
        status: 'pending',
        message: 'Order placed. Awaiting confirmation.'
      });

      if (window.RosellerCart) {
        try { await window.RosellerCart.clear(); } catch {}
      }
      location.href = `order-success.html?order=${encodeURIComponent(orderNumber)}`;

    } catch (err) {
      console.error('[checkout]', err);
      btn.disabled = false;
      btn.textContent = 'Place Order ✓';
      alert('Could not place order: ' + (err.message || 'Unknown error'));
    }
  });

  /* ============================================================
     Events
     ============================================================ */
  document.addEventListener('partials:loaded', () => {
    renderSummary();
    autofillFromProfile();
  });
  document.addEventListener('cart:updated', renderSummary);
  document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    autofillFromProfile();
  });
  document.addEventListener('auth:changed', () => {
    renderSummary();
    autofillFromProfile();
  });

  const readyCheck = setInterval(() => {
    if (window.RosellerSupabase && window.ROSELLER_PRODUCTS) {
      clearInterval(readyCheck);
      renderSummary();
      autofillFromProfile();
    }
  }, 100);

  renderSummary();
  autofillFromProfile();
})();