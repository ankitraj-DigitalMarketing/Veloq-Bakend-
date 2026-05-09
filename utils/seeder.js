require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Collection = require('../models/Collection');

const SAMPLE_PRODUCTS = [
  /* ── SNEAKERS ─────────────────────────────────────────────────────────── */
  {
    name: 'VELOQ Runner Pro',
    description: 'The VELOQ Runner Pro combines reactive-foam cushioning with a breathable mesh upper. Built for daily runners who refuse to sacrifice style for performance. Lightweight, responsive, and built to last.',
    category: 'men',
    brand: 'VELOQ',
    price: 2999,
    comparePrice: 3999,
    tags: ['sneakers'],
    images: [{ url: 'https://placehold.co/600x600/111111/ffffff?text=VELOQ+RUNNER+PRO', alt: 'VELOQ Runner Pro' }],
    variants: [
      { size: 'UK 7', color: 'Black', stock: 20 },
      { size: 'UK 8', color: 'Black', stock: 25 },
      { size: 'UK 9', color: 'Black', stock: 18 },
      { size: 'UK 10', color: 'Black', stock: 12 },
      { size: 'UK 7', color: 'White', stock: 15 },
      { size: 'UK 8', color: 'White', stock: 20 },
      { size: 'UK 9', color: 'White', stock: 10 },
    ],
    status: 'active', isBestSeller: true, isNewArrival: true, isFeatured: true,
  },
  {
    name: 'VELOQ Stealth X',
    description: 'Ultra-lightweight with a sleek black-on-black colorway. The Stealth X is built for those who prefer understated luxury. Zero-distraction design, maximum impact on the streets.',
    category: 'men',
    brand: 'VELOQ',
    price: 3499,
    comparePrice: 4500,
    tags: ['sneakers'],
    images: [{ url: 'https://placehold.co/600x600/0a0a0a/eeeeee?text=VELOQ+STEALTH+X', alt: 'VELOQ Stealth X' }],
    variants: [
      { size: 'UK 6', color: 'Black', stock: 12 },
      { size: 'UK 7', color: 'Black', stock: 18 },
      { size: 'UK 8', color: 'Black', stock: 22 },
      { size: 'UK 9', color: 'Black', stock: 16 },
      { size: 'UK 10', color: 'Black', stock: 10 },
    ],
    status: 'active', isFeatured: true, isNewArrival: true,
  },
  {
    name: 'VELOQ Street Hi',
    description: 'High-top silhouette with padded ankle support and a premium canvas upper. A statement sneaker that blends 90s basketball heritage with modern streetwear confidence.',
    category: 'men',
    brand: 'VELOQ',
    price: 3199,
    comparePrice: 3999,
    tags: ['sneakers'],
    images: [{ url: 'https://placehold.co/600x600/1a1a1a/f5f5f5?text=VELOQ+STREET+HI', alt: 'VELOQ Street Hi' }],
    variants: [
      { size: 'UK 7', color: 'White', stock: 14 },
      { size: 'UK 8', color: 'White', stock: 18 },
      { size: 'UK 9', color: 'White', stock: 12 },
      { size: 'UK 7', color: 'Grey', stock: 10 },
      { size: 'UK 8', color: 'Grey', stock: 14 },
      { size: 'UK 9', color: 'Grey', stock: 8 },
    ],
    status: 'active', isBestSeller: true,
  },

  /* ── CASUAL SHOES ──────────────────────────────────────────────────────── */
  {
    name: 'VELOQ Classic Low',
    description: 'Timeless low-top silhouette. Clean lines, premium full-grain leather uppers, and iconic VELOQ branding make this a wardrobe staple. Goes with everything.',
    category: 'men',
    brand: 'VELOQ',
    price: 1999,
    comparePrice: 2499,
    tags: ['casual'],
    images: [{ url: 'https://placehold.co/600x600/f5f5f0/333333?text=VELOQ+CLASSIC+LOW', alt: 'VELOQ Classic Low' }],
    variants: [
      { size: 'UK 6', color: 'White', stock: 20 },
      { size: 'UK 7', color: 'White', stock: 28 },
      { size: 'UK 8', color: 'White', stock: 30 },
      { size: 'UK 9', color: 'White', stock: 22 },
      { size: 'UK 10', color: 'White', stock: 15 },
      { size: 'UK 6', color: 'Black', stock: 16 },
      { size: 'UK 7', color: 'Black', stock: 20 },
    ],
    status: 'active', isBestSeller: true, isFeatured: true,
  },
  {
    name: 'VELOQ Derby Walk',
    description: 'Smart casual Oxford reinterpreted for the modern man. Soft suede upper, cushioned insole, and a flexible rubber sole that keeps you comfortable from 9am to midnight.',
    category: 'men',
    brand: 'VELOQ',
    price: 2499,
    comparePrice: 3200,
    tags: ['casual'],
    images: [{ url: 'https://placehold.co/600x600/1c1c1c/cccccc?text=VELOQ+DERBY+WALK', alt: 'VELOQ Derby Walk' }],
    variants: [
      { size: 'UK 7', color: 'Brown', stock: 12 },
      { size: 'UK 8', color: 'Brown', stock: 16 },
      { size: 'UK 9', color: 'Brown', stock: 14 },
      { size: 'UK 7', color: 'Black', stock: 10 },
      { size: 'UK 8', color: 'Black', stock: 14 },
    ],
    status: 'active', isNewArrival: true,
  },
  {
    name: 'VELOQ Urban Loafer',
    description: 'Slip-on comfort meets premium craftsmanship. The Urban Loafer features a hand-stitched moccasin toe, memory foam lining, and an anti-slip sole — your everyday essential.',
    category: 'men',
    brand: 'VELOQ',
    price: 2799,
    comparePrice: 3500,
    tags: ['casual'],
    images: [{ url: 'https://placehold.co/600x600/2a2010/e8d5a0?text=VELOQ+URBAN+LOAFER', alt: 'VELOQ Urban Loafer' }],
    variants: [
      { size: 'UK 6', color: 'Tan', stock: 10 },
      { size: 'UK 7', color: 'Tan', stock: 14 },
      { size: 'UK 8', color: 'Tan', stock: 18 },
      { size: 'UK 9', color: 'Tan', stock: 12 },
      { size: 'UK 7', color: 'Black', stock: 12 },
      { size: 'UK 8', color: 'Black', stock: 15 },
    ],
    status: 'active', isBestSeller: true,
  },

  /* ── SLIPPERS & CLOGS ─────────────────────────────────────────────────── */
  {
    name: 'VELOQ Cloud Slide',
    description: 'Step onto a cloud. The Cloud Slide features a single-band upper and an ultra-thick EVA foam footbed that contours to your foot. The only slide you\'ll ever need.',
    category: 'men',
    brand: 'VELOQ',
    price: 999,
    comparePrice: 1499,
    tags: ['slippers'],
    images: [{ url: 'https://placehold.co/600x600/eeeeee/111111?text=VELOQ+CLOUD+SLIDE', alt: 'VELOQ Cloud Slide' }],
    variants: [
      { size: 'UK 6', color: 'White', stock: 25 },
      { size: 'UK 7', color: 'White', stock: 30 },
      { size: 'UK 8', color: 'White', stock: 30 },
      { size: 'UK 9', color: 'White', stock: 20 },
      { size: 'UK 6', color: 'Black', stock: 20 },
      { size: 'UK 7', color: 'Black', stock: 25 },
      { size: 'UK 8', color: 'Black', stock: 25 },
    ],
    status: 'active', isBestSeller: true, isNewArrival: true,
  },
  {
    name: 'VELOQ Foam Clog',
    description: 'Lightweight, ventilated, and indestructible. The VELOQ Foam Clog is made from closed-cell EVA resin — it won\'t smell, won\'t stain, and won\'t let you down.',
    category: 'men',
    brand: 'VELOQ',
    price: 1199,
    comparePrice: 1799,
    tags: ['slippers'],
    images: [{ url: 'https://placehold.co/600x600/111111/ffffff?text=VELOQ+FOAM+CLOG', alt: 'VELOQ Foam Clog' }],
    variants: [
      { size: 'UK 7', color: 'Black', stock: 22 },
      { size: 'UK 8', color: 'Black', stock: 28 },
      { size: 'UK 9', color: 'Black', stock: 20 },
      { size: 'UK 7', color: 'Grey', stock: 18 },
      { size: 'UK 8', color: 'Grey', stock: 22 },
    ],
    status: 'active', isFeatured: true, isNewArrival: true,
  },
  {
    name: 'VELOQ House Slipper',
    description: 'The premium indoor companion. Plush sherpa lining, memory foam footbed, and a non-slip rubber sole. Designed for those who demand luxury even at home.',
    category: 'men',
    brand: 'VELOQ',
    price: 799,
    comparePrice: 1199,
    tags: ['slippers'],
    images: [{ url: 'https://placehold.co/600x600/2a2a2a/ffffff?text=VELOQ+HOUSE+SLIPPER', alt: 'VELOQ House Slipper' }],
    variants: [
      { size: 'UK 6', color: 'Grey', stock: 20 },
      { size: 'UK 7', color: 'Grey', stock: 25 },
      { size: 'UK 8', color: 'Grey', stock: 25 },
      { size: 'UK 9', color: 'Grey', stock: 18 },
      { size: 'UK 6', color: 'Black', stock: 15 },
      { size: 'UK 7', color: 'Black', stock: 18 },
    ],
    status: 'active', isBestSeller: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await User.deleteMany({});
  await Product.deleteMany({});
  await Collection.deleteMany({});
  console.log('🗑️  Cleared existing data');

  await User.create({
    name: 'VELOQ Admin',
    email: 'admin@veloq.com',
    password: 'admin123',
    role: 'admin',
    phone: '9999999999',
  });
  console.log('👤 Admin created: admin@veloq.com / admin123');

  const products = await Product.insertMany(SAMPLE_PRODUCTS);
  console.log(`📦 ${products.length} products created`);

  const sneakers = products.filter(p => p.tags?.includes('sneakers'));
  const casual   = products.filter(p => p.tags?.includes('casual'));
  const slippers = products.filter(p => p.tags?.includes('slippers'));
  const newArrivals = products.filter(p => p.isNewArrival);

  await Collection.insertMany([
    {
      name: 'Sneakers',
      slug: 'sneakers',
      description: 'Bold kicks built for the streets. Performance meets premium style.',
      displayOrder: 1,
      isActive: true,
      products: sneakers.map(p => p._id),
    },
    {
      name: 'Casual Shoes',
      slug: 'casual-shoes',
      description: 'Effortless style for every day. Smart, comfortable, and undeniably VELOQ.',
      displayOrder: 2,
      isActive: true,
      products: casual.map(p => p._id),
    },
    {
      name: 'Slippers & Clogs',
      slug: 'slippers-clogs',
      description: 'Unwind in style. Our slides, clogs, and house slippers redefine at-home luxury.',
      displayOrder: 3,
      isActive: true,
      products: slippers.map(p => p._id),
    },
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'The latest drops from VELOQ.',
      displayOrder: 4,
      isActive: true,
      products: newArrivals.map(p => p._id),
    },
  ]);
  console.log('🗂️  4 collections created: Sneakers, Casual Shoes, Slippers & Clogs, New Arrivals');

  console.log('\n✅ Seeding complete!');
  console.log('   Admin: admin@veloq.com / admin123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
