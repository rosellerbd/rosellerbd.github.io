/* =========================================================
   Roseller — data/products.js
   Garments & fashion catalog with real product images.
   Renders nothing. Images from Unsplash (free to use).
   ========================================================= */
window.ROSELLER_PRODUCTS = [
  /* ---------- Men's Shirts ---------- */
  { id:'RL-MS-001', name:'Premium Cotton Formal Shirt — White',
    category:'mens-shirt', brand:'Ecstasy', price:1450, oldPrice:1850, tag:'-22%', featured:true, bestseller:true,
    image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MS-002', name:'Slim Fit Casual Shirt — Navy Blue',
    category:'mens-shirt', brand:'Sailor', price:1290, oldPrice:1690, tag:'-24%', featured:true,
    image:'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MS-003', name:'Checkered Flannel Shirt — Red/Black',
    category:'mens-shirt', brand:'Easy', price:1650, oldPrice:2100, tag:'-21%', bestseller:true,
    image:'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MS-004', name:'Linen Blend Shirt — Beige',
    category:'mens-shirt', brand:'Yellow', price:1750, oldPrice:2200, tag:'-20%', featured:true,
    image:'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Men's Pants ---------- */
  { id:'RL-MP-001', name:'Slim Fit Chino Pant — Khaki',
    category:'mens-pant', brand:'Sailor', price:1890, oldPrice:2400, tag:'-21%', bestseller:true,
    image:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MP-002', name:'Classic Denim Jeans — Dark Blue',
    category:'mens-pant', brand:'Ecstasy', price:2490, oldPrice:3200, tag:'-22%', featured:true, bestseller:true,
    image:'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MP-003', name:'Formal Trouser — Charcoal Grey',
    category:'mens-pant', brand:'Richman', price:2190, oldPrice:2790, tag:'-22%',
    image:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MP-004', name:'Cargo Pant — Olive Green',
    category:'mens-pant', brand:'Easy', price:1990, oldPrice:2590, tag:'-23%', featured:true,
    image:'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Men's T-Shirts ---------- */
  { id:'RL-MT-001', name:'Premium Cotton Polo — Navy',
    category:'mens-tshirt', brand:'Ecstasy', price:990, oldPrice:1290, tag:'-23%', bestseller:true,
    image:'https://images.unsplash.com/photo-1625910513371-5d47b4e8e7f5?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MT-002', name:'Graphic Print T-Shirt — Black',
    category:'mens-tshirt', brand:'Sailor', price:690, oldPrice:890, tag:'-22%', featured:true,
    image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-MT-003', name:'Striped Round Neck T-Shirt — White',
    category:'mens-tshirt', brand:'Easy', price:590, oldPrice:790, tag:'-25%', bestseller:true,
    image:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Women's Dresses ---------- */
  { id:'RL-WD-001', name:'Floral Summer Maxi Dress',
    category:'womens-dress', brand:'Cats Eye', price:2290, oldPrice:2990, tag:'-23%', featured:true, bestseller:true,
    image:'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WD-002', name:'Elegant Evening Gown — Burgundy',
    category:'womens-dress', brand:'Yellow', price:3990, oldPrice:4990, tag:'-20%', featured:true,
    image:'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WD-003', name:'Cotton Casual Midi Dress — Sky Blue',
    category:'womens-dress', brand:'Dorjibari', price:1690, oldPrice:2190, tag:'-23%',
    image:'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Women's Kurti ---------- */
  { id:'RL-WK-001', name:'Embroidered Cotton Kurti — Teal',
    category:'womens-kurti', brand:'Aarong', price:1890, oldPrice:2490, tag:'-24%', bestseller:true,
    image:'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WK-002', name:'Printed Anarkali Kurti — Maroon',
    category:'womens-kurti', brand:'Kay Kraft', price:2190, oldPrice:2790, tag:'-21%', featured:true,
    image:'https://images.unsplash.com/photo-1583391733958-6c2e3c1b6e3f?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WK-003', name:'Floral Straight Kurti — Pink',
    category:'womens-kurti', brand:'Infinity', price:1490, oldPrice:1890, tag:'-21%',
    image:'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Women's Saree ---------- */
  { id:'RL-WS-001', name:'Jamdani Cotton Saree — Off White',
    category:'womens-saree', brand:'Aarong', price:4490, oldPrice:5990, tag:'-25%', featured:true, bestseller:true,
    image:'https://images.unsplash.com/photo-1610030469668-8e5b2c3a7b6e?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WS-002', name:'Silk Banarasi Saree — Deep Red',
    category:'womens-saree', brand:'Kay Kraft', price:6990, oldPrice:8990, tag:'-22%', featured:true,
    image:'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-WS-003', name:'Georgette Party Saree — Navy',
    category:'womens-saree', brand:'Yellow', price:3490, oldPrice:4490, tag:'-22%',
    image:'https://images.unsplash.com/photo-1583391733958-6c2e3c1b6e3f?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Kids ---------- */
  { id:'RL-KD-001', name:'Boys Cotton T-Shirt + Shorts Set',
    category:'kids', brand:'Sailor', price:890, oldPrice:1190, tag:'-25%', bestseller:true,
    image:'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-KD-002', name:'Girls Floral Frock — Pink',
    category:'kids', brand:'Cats Eye', price:1190, oldPrice:1590, tag:'-25%', featured:true,
    image:'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-KD-003', name:'Kids Denim Jacket — Blue',
    category:'kids', brand:'Easy', price:1490, oldPrice:1990, tag:'-25%',
    image:'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-KD-004', name:'Baby Cotton Romper Pack (2 pcs)',
    category:'kids', brand:'Dorjibari', price:990, oldPrice:1390, tag:'-29%', bestseller:true,
    image:'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  /* ---------- Accessories ---------- */
  { id:'RL-AC-001', name:'Leather Handbag — Tan Brown',
    category:'accessories', brand:'Ecstasy', price:2790, oldPrice:3690, tag:'-24%', featured:true, bestseller:true,
    image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-AC-002', name:'Silk Scarf — Multicolor',
    category:'accessories', brand:'Yellow', price:690, oldPrice:990, tag:'-30%',
    image:'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-AC-003', name:'Formal Leather Belt — Black',
    category:'accessories', brand:'Richman', price:990, oldPrice:1290, tag:'-23%', bestseller:true,
    image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-AC-004', name:'Classic Aviator Sunglasses',
    category:'accessories', brand:'Infinity', price:1290, oldPrice:1790, tag:'-28%', featured:true,
    image:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' },

  { id:'RL-AC-005', name:'Pearl Drop Earrings Set',
    category:'accessories', brand:'Cats Eye', price:590, oldPrice:890, tag:'-34%',
    image:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&q=80',
    stock:'In Stock', warranty:'7 Days Return' }
];