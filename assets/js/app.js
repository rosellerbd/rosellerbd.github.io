(function () {
  'use strict';
  document.addEventListener('partials:loaded', () => {
    /* Close mobile menu on link click */
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.add('hidden'))
    );
  });
  console.log('%cRoseller', 'color:#e53935;font-weight:800;font-size:14px;', '— Your Tech, Your Way');
})();