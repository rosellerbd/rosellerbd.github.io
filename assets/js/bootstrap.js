// ============================================================
// Roseller — bootstrap.js
// Loads all shared scripts in the correct order.
// Usage: <script src="assets/js/bootstrap.js"></script>
// ============================================================
(function () {
  'use strict';

  /* --- 1. Plain scripts (run synchronously, in order) --- */
  const plain = [
    'config.js',
    'cards.js',
    'ticker.js',
    'include.js',
    'search.js',
    'app.js',
    'cart.js',
    'wishlist.js',
    'auth-ui.js'
  ];

  /* --- 2. Module scripts (deferred, run after plain scripts) --- */
  const modules = [
    'supabase.js',
    'auth.js'
  ];

  const base = document.currentScript.getAttribute('src').replace('bootstrap.js', '');

  // Inject plain scripts in order
  plain.forEach(function (file) {
    const el = document.createElement('script');
    el.src = base + file;
    el.async = false;             // force sequential execution
    document.head.appendChild(el);
  });

  // Inject module scripts
  modules.forEach(function (file) {
    const el = document.createElement('script');
    el.type = 'module';
    el.src = base + file;
    document.head.appendChild(el);
  });
})();