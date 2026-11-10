// ============================================================
// Roseller — auth-ui.js (v4)
// Hover + click + badges + SVG avatar fallback
// ============================================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  /* ============================================================
     AVATAR FALLBACK
     Build a red-circle SVG data-URI with the user's initial.
     Avoids the broken-image icon that <img> shows when src is
     empty or removed.
     ============================================================ */
  function avatarFallback(letter) {
    const safe = (letter || '?').replace(/[<>&"']/g, '').slice(0, 2);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
        '<circle cx="20" cy="20" r="20" fill="#e53935"/>' +
        '<text x="50%" y="54%" text-anchor="middle" ' +
              'dominant-baseline="middle" ' +
              'font-family="Inter, -apple-system, sans-serif" ' +
              'font-size="18" font-weight="700" fill="#ffffff">' +
          safe +
        '</text>' +
      '</svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

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

    /* ---------- LOGGED OUT ---------- */
    if (!user) {
      loginBtn.classList.remove('hidden');
      userBox.classList.add('hidden');

      if (mobileLink) {
        mobileLink.textContent = '👤 Sign In';
        mobileLink.href = 'dashboard.html';
      }

      hideBadge('auth-dd-orders-count');
      hideBadge('auth-dd-wishlist-count');
      hideBadge('auth-dd-cart-count');

      // Also clear the avatar src so next login starts fresh
      if (avatar)   { avatar.removeAttribute('src'); avatar.alt = ''; }
      if (ddAvatar) { ddAvatar.removeAttribute('src'); ddAvatar.alt = ''; }

      return;
    }

    /* ---------- LOGGED IN ---------- */
    loginBtn.classList.add('hidden');
    userBox.classList.remove('hidden');

    const displayName = user.displayName || user.email || 'Account';
    const initial     = displayName.trim().charAt(0).toUpperCase();
    const photo       = user.photoURL || '';
    const fallback    = avatarFallback(initial);

    if (avatar) {
      avatar.src = photo || fallback;
      avatar.alt = displayName;
    }
    if (ddAvatar) {
      ddAvatar.src = photo || fallback;
      ddAvatar.alt = displayName;
    }
    if (nameEl)  nameEl.textContent = displayName.split(' ')[0];
    if (ddName)  ddName.textContent = displayName;
    if (ddEmail) ddEmail.textContent = user.email || '';

    // Update the mobile menu link BEFORE any awaits so it is
    // correct even if the Supabase badge fetches below fail or hang.
    if (mobileLink) {
      mobileLink.textContent = `👤 ${displayName.split(' ')[0]}`;
      mobileLink.href = 'dashboard.html';
    }

    /* ---------- BADGES (Supabase) ---------- */
    if (!window.RosellerSupabase) return;
    const sb = window.RosellerSupabase;

    try {
      const { data: orders } = await sb
        .from('orders').select('status').eq('user_id', user.uid);
      const open = (orders || []).filter(o =>
        ['pending', 'confirmed', 'shipped'].includes(o.status)
      ).length;
      setBadge('auth-dd-orders-count', open);
    } catch (e) {
      console.warn('[auth-ui] orders', e);
      hideBadge('auth-dd-orders-count');
    }

    try {
      const { data: wl } = await sb
        .from('wishlists').select('id').eq('user_id', user.uid);
      setBadge('auth-dd-wishlist-count', (wl || []).length);
    } catch (e) {
      console.warn('[auth-ui] wishlist', e);
      hideBadge('auth-dd-wishlist-count');
    }

    try {
      const { data: cart } = await sb
        .from('carts').select('qty').eq('user_id', user.uid);
      const totalQty = (cart || []).reduce((s, r) => s + (r.qty || 0), 0);
      setBadge('auth-dd-cart-count', totalQty);
    } catch (e) {
      console.warn('[auth-ui] cart', e);
      hideBadge('auth-dd-cart-count');
    }
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
    if (dd)  dd.classList.remove('hidden');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDropdown() {
    const dd  = $('auth-dropdown');
    const btn = $('auth-user-btn');
    if (dd)  dd.classList.add('hidden');
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

    /* Hover opens on devices that actually have hover (desktop mice).
       On touch devices, ONLY click toggles — otherwise mouseenter on tap
       opens the menu, then the click handler immediately closes it. */
    if (widget && !widget.dataset.hoverWired) {
      widget.dataset.hoverWired = '1';

      const canHover =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      if (canHover) {
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
    }

    /* Escape closes the dropdown */
    if (!document.body.dataset.authEscapeWired) {
      document.body.dataset.authEscapeWired = '1';
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const dd = $('auth-dropdown');
          if (dd && !dd.classList.contains('hidden')) {
            closeDropdown();
            const btn = $('auth-user-btn');
            if (btn && typeof btn.focus === 'function') btn.focus();
          }
        }
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
        const w = $('auth-widget');
        if (!w) return;
        if (!w.contains(e.target)) closeDropdown();
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
     BOOT — idempotent
     DOMContentLoaded and partials:loaded can both call boot().
     Both the auth:changed listener and the onReady handler must
     run exactly once, or applyAuth fires multiple times and
     multiplies Supabase queries.
     ============================================================ */
  let _booted          = false;
  let _authChangedBound = false;

  function boot() {
    wireEvents();

    if (!_authChangedBound) {
      _authChangedBound = true;
      document.addEventListener('auth:changed', (e) => {
        applyAuth(e && e.detail ? e.detail.user : null);
      });
    }

    if (!_booted && window.RosellerAuth) {
      _booted = true;
      window.RosellerAuth.onReady((user) => applyAuth(user));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  document.addEventListener('partials:loaded', boot);
})();