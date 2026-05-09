const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'VELOQ' },
    storeLogo: String,
    storeFavicon: String,
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    gstRate: { type: Number, default: 18 },
    freeShippingThreshold: { type: Number, default: 999 },
    shippingCharge: { type: Number, default: 99 },
    razorpayKeyId: String,
    razorpayKeySecret: String,
    emailHost: String,
    emailPort: Number,
    emailUser: String,
    emailPass: String,
    emailFrom: String,
    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
      youtube: String,
    },
    metaTitle: String,
    metaDescription: String,
    announcementText: { type: String, default: "Free delivery on orders above ₹999 · 100% Authentic Men's Footwear" },
    announcementEnabled: { type: Boolean, default: true },
    contactEmail: String,
    contactPhone: String,
    address: String,
    aboutText: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
