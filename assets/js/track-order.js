// ============================================================
// Roseller — track-order.js
// ============================================================
import { supabase } from './supabase.js';

const form   = document.getElementById('track-form');
const input  = document.getElementById('track-input');
const result = document.getElementById('track-result');

const fmt   = n => '৳' + Number(n || 0).toLocaleString('en-BD');
const fmtDt = s => s ? new Date(s).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const STATUS_LABEL = {
  pending:   'Pending',
  confirmed: 'Confirmed',
  shipped:   'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

if (form) {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const num = (input.value || '').trim().toUpperCase();
    if (!num) return;

    result.innerHTML = '<p style="color:var(--muted)">Looking up…</p>';

    try {
      /* Ensure signed in */
      if (!window.RosellerAuth) throw new Error('Auth not loaded');
      await window.RosellerAuth.onReady();
      if (!window.RosellerAuth.currentUser) await window.RosellerAuth.login();
      await new Promise(r => window.RosellerAuth.onReady(r));
      if (!window.RosellerAuth.currentUser) throw new Error('Login cancelled');

      /* Order lookup (RLS restricts to own orders) */
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', num)
        .maybeSingle();

      if (error) throw error;

      if (!order) {
        result.innerHTML = `
          <div class="products-empty" style="max-width:520px;">
            <div class="empty-icon">🔍</div>
            <h2>Order not found</h2>
            <p>No order with number <strong>${num}</strong> exists under your account.</p>
            <p style="font-size:12px;color:var(--muted);margin-top:8px;">
              Make sure you're signed in with the same Google account used at checkout.
            </p>
          </div>`;
        return;
      }

      /* Parallel fetch of items and timeline */
      const [{ data: events }, { data: items }] = await Promise.all([
        supabase.from('tracking_events').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
        supabase.from('order_items').select('*').eq('order_id', order.id)
      ]);

      result.innerHTML = `
        <div class="cart-summary" style="max-width:680px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
            <h2 style="margin:0;">Order ${order.order_number}</h2>
            <span class="badge badge-${order.status}">${STATUS_LABEL[order.status] || order.status}</span>
          </div>

          <div class="summary-row"><span>Placed on</span><strong>${fmtDt(order.created_at)}</strong></div>
          <div class="summary-row"><span>Payment</span><strong>${(order.payment_method||'COD').toUpperCase()}</strong></div>
          <div class="summary-row summary-row--total"><span>Total</span><strong>${fmt(order.total)}</strong></div>

          <h3 style="margin:20px 0 8px;font-size:14px;">Delivery to</h3>
          <div style="background:#fafafa;padding:12px;border-radius:6px;font-size:13px;line-height:1.7;">
            <strong>${order.shipping_name || '—'}</strong><br>
            ${order.shipping_phone || ''}<br>
            ${order.shipping_address || ''}${order.shipping_city ? ', ' + order.shipping_city : ''}
            ${order.notes ? `<div style="margin-top:6px;color:var(--muted);font-size:12px;">Note: ${order.notes}</div>` : ''}
          </div>

          <h3 style="margin:20px 0 8px;font-size:14px;">Items (${(items||[]).length})</h3>
          ${(items || []).map(it => `
            <div class="checkout-item">
              ${it.image ? `<img src="${it.image}" alt="">` : ''}
              <div class="checkout-item-info">
                <h5>${it.product_name}</h5>
                <p>Qty ${it.qty} × ${fmt(it.price)}</p>
              </div>
              <strong>${fmt(it.price * it.qty)}</strong>
            </div>`).join('') || '<p class="cart-empty">No items recorded.</p>'}

          <h3 style="margin:20px 0 8px;font-size:14px;">Timeline</h3>
          <ul style="list-style:none;padding:0;margin:0;">
            ${(events || []).map((ev, i) => `
              <li style="padding:12px 0;border-bottom:1px solid var(--line);display:flex;gap:12px;align-items:flex-start;">
                <div style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--primary)':'#d1d5db'};margin-top:6px;flex-shrink:0;"></div>
                <div style="flex:1;">
                  <strong style="font-size:13px;">${STATUS_LABEL[ev.status] || ev.status}</strong>
                  <span style="color:var(--muted);font-size:11.5px;margin-left:8px;">${fmtDt(ev.created_at)}</span>
                  ${ev.message ? `<div style="font-size:12.5px;color:var(--muted);margin-top:2px;">${ev.message}</div>` : ''}
                </div>
              </li>`).join('') || '<li style="color:var(--muted);font-size:13px;">No tracking events yet.</li>'}
          </ul>

          <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line);display:flex;gap:8px;flex-wrap:wrap;">
            <a href="https://wa.me/8801876757033?text=${encodeURIComponent('Hi Roseller, I need help with order ' + order.order_number)}" target="_blank" rel="noopener" class="btn-secondary">Contact Support</a>
            <a href="products.html" class="btn-primary">Continue Shopping</a>
          </div>
        </div>`;
    } catch (err) {
      console.error('[track-order]', err);
      result.innerHTML = `
        <div class="products-empty" style="max-width:520px;">
          <h2>Something went wrong</h2>
          <p>${err.message || 'Unknown error'}</p>
        </div>`;
    }
  });

  /* Auto-fill and auto-track if ?order=... is in the URL */
  const urlOrder = new URLSearchParams(location.search).get('order');
  if (urlOrder && input) {
    input.value = urlOrder;
    /* Small delay so the module's own DOMContentLoaded handlers finish first */
    setTimeout(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }, 200);
  }
}