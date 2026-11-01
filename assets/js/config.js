/* =========================================================
   Roseller — config.js
   Loads data/content.json and merges onto safe defaults.
   Dispatches 'roseller:content' when ready.
   ========================================================= */
(function () {
  'use strict';

  /* Safe defaults — used if content.json fails to load */
  window.ROSELLER = {
    loaded: false,
    brand: {
      name: 'Roseller',
      tagline: 'Fashion That Fits Your Life',
      email: 'support@roseller.com',
      phone: '+8801876757033',
      whatsapp: '8801876757033',
      address: 'Dhaka, Bangladesh'
    },
    categories: [],
    brands: [],
    payment_methods: ['VISA', 'Mastercard', 'bKash', 'Nagad', 'Rocket', 'COD'],
    notices: ['Welcome to Roseller — Bangladesh\'s trusted fashion shop!'],
    delivery: { fee: 60, freeMin: 5000 },
    currency: '৳'
  };

  fetch('data/content.json', { cache: 'no-cache' })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('content.json not found')))
    .then(data => {
      /* Deep-ish merge: brand/delivery objects merge, arrays replace */
      if (data.brand)    Object.assign(window.ROSELLER.brand, data.brand);
      if (data.delivery) Object.assign(window.ROSELLER.delivery, data.delivery);
      ['categories', 'brands', 'payment_methods', 'notices'].forEach(k => {
        if (Array.isArray(data[k]) && data[k].length) window.ROSELLER[k] = data[k];
      });
      if (data.currency) window.ROSELLER.currency = data.currency;
    })
    .catch(err => console.warn('[Roseller config]', err.message, '— using defaults.'))
    .finally(() => {
      window.ROSELLER.loaded = true;
      document.dispatchEvent(new CustomEvent('roseller:content'));
    });
})();