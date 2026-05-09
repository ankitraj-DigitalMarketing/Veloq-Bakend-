const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  position: { type: Number, required: true, min: 1, max: 4, unique: true },
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true, default: '' },
  image: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/products' },
  bgColor: { type: String, default: '#f3f4f6' },
  textDark: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);
