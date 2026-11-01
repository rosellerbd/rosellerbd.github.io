// ============================================================
// Roseller — auth-ui.js (v3, hover + click + badges)
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  /* ============================================================
     APPLY AUTH STATE
     ============================================================ */
  async function applyAuth(user) {
    const loginBtn   = $('auth-login-btn');
    const userBox    = $('auth-user');
    const avatar     = $('auth-avatar');
    const nameEl     = $('auth-name');
    const ddName     = $('auth-dd-name');
    const ddEmail    = $('auth-dd-email');
    const ddAvatar   = $('auth-dd-avatar');
    const mobileLink = $('mobile-auth-link');

    if (!loginBtn || !userBox) return;

    if (!user) {
      loginBtn.classList.remove('hidden');
      userBox.classList.add('hidden');
      if (mobileLink) { mobileLink.textContent = '👤 Sign In'; mobileLink.href = 'dashboard.html'; }
      hideBadge('auth-dd-orders-count');
      hideBadge('auth-dd-wishlist-count');
      hideBadge('auth-dd-cart-count');
      return;
    }

    loginBtn.classList.add('hidden');
    userBox.classList.remove('hidden');

    const displayName = user.displayName || user.email || 'Account';
    if (avatar)   avatar.src = user.photoURL || '';
    if (ddAvatar) ddAvatar.src = user.photoURL || '';
    if (nameEl)   nameEl.textContent = displayName.split(' ')[0];
    if (ddName)   ddName.textContent = displayName;
    if (ddEmail)  ddEmail.textContent = user.email || '';

    if (mobileLink) {
      mobileLink.textContent = `👤 ${displayName.split(' ')[0]}`;
      mobileLink.href = 'dashboard.html';
    }

    if (!window.RosellerSupabase) return;
    const sb = window.RosellerSupabase;

    try {
      const { data: orders } = await sb
        .from('orders').select('status').eq('user_id', user.uid);
      const open = (orders || []).filter(o =>
        ['pending', 'confirmed', 'shipped'].includes(o.status)
      ).length;
      setBadge('auth-dd-orders-count', open);
    } catch (e) { console.warn('[auth-ui] orders', e); hideBadge('auth-dd-orders-count'); }

    try {
      const { data: wl } = await sb
        .from('wishlists').select('id').eq('user_id', user.uid);
      setBadge('auth-dd-wishlist-count', (wl || []).length);
    } catch (e) { console.warn('[auth-ui] wishlist', e); hideBadge('auth-dd-wishlist-count'); }

    try {
      const { data: cart } = await sb
        .from('carts').select('qty').eq('user_id', user.uid);
      const totalQty = (cart || []).reduce((s, r) => s + r.qty, 0);
      setBadge('auth-dd-cart-count', totalQty);
    } catch (e) { console.warn('[auth-ui] cart', e); hideBadge('auth-dd-cart-count'); }
  }

  function setBadge(id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    if (n > 0) { el.textContent = n; el.hidden = false; }
    else el.hidden = true;
  }

  function hideBadge(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  /* ============================================================
     OPEN / CLOSE DROPDOWN
     ============================================================ */
  function openDropdown() {
    const dd  = $('auth-dropdown');
    const btn = $('auth-user-btn');
    if (dd) dd.classList.remove('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    const dd  = $('auth-dropdown');
    const btn = $('auth-user-btn');
    if (dd) dd.classList.add('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  /* ============================================================
     WIRE UP EVENTS
     ============================================================ */
  function wireEvents() {
    const loginBtn = $('auth-login-btn');
    const userBtn  = $('auth-user-btn');
    const dropdown = $('auth-dropdown');
    const widget   = $('auth-widget');
    const signout  = $('auth-signout');

    /* Sign-in button */
    if (loginBtn && !loginBtn.dataset.wired) {
      loginBtn.dataset.wired = '1';
      loginBtn.onclick = () => {
        if (window.RosellerAuth) window.RosellerAuth.login();
      };
    }

    /* Avatar button — click toggles */
    if (userBtn && !userBtn.dataset.wired) {
      userBtn.dataset.wired = '1';
      userBtn.onclick = (e) => {
        e.stopPropagation();
        if (!dropdown) return;
        if (dropdown.classList.contains('hidden')) openDropdown();
        else closeDropdown();
      };
    }

    /* Hover opens; leaving closes (with a small delay so moving into the menu works) */
    if (widget && !widget.dataset.hoverWired) {
      widget.dataset.hoverWired = '1';

      let hideTimer = null;

      widget.addEventListener('mouseenter', () => {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        openDropdown();
      });

      widget.addEventListener('mouseleave', () => {
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          closeDropdown();
          hideTimer = null;
        }, 250);
      });
    }

    /* Sign out */
    if (signout && !signout.dataset.wired) {
      signout.dataset.wired = '1';
      signout.onclick = () => {
        if (window.RosellerAuth) {
          window.RosellerAuth.logout().then(() => location.reload());
        }
      };
    }

    /* Click outside closes */
    if (!document.body.dataset.authOutsideWired) {
      document.body.dataset.authOutsideWired = '1';
      document.addEventListener('click', (e) => {
        if (!widget) return;
        if (!widget.contains(e.target)) closeDropdown();
      });
    }

    /* Clicking any link inside the dropdown closes it (navigation still runs) */
    if (dropdown && !dropdown.dataset.linksWired) {
      dropdown.dataset.linksWired = '1';
      dropdown.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (a) closeDropdown();
      });
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    wireEvents();
    if (window.RosellerAuth) {
      window.RosellerAuth.onReady(user => applyAuth(user));
    }
    document.addEventListener('auth:changed', e => applyAuth(e.detail.user));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  document.addEventListener('partials:loaded', boot);
})();