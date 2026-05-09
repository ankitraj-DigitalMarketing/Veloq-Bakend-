const mongoose = require('mongoose');
const slugify = require('slugify');

const variantSchema = new mongoose.Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  colorHex: String,
  stock: { type: Number, required: true, default: 0 },
  sku: String,
});

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: [String],
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true },
    sku: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    shortDescription: String,
    images: [{ url: String, alt: String }],
    category: {
      type: String,
      required: true,
      enum: ['men', 'women', 'kids', 'sports', 'casual', 'formal'],
    },
    subCategory: String,
    brand: { type: String, default: 'VELOQ' },
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    tags: [String],
    variants: [variantSchema],
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    comparePrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    weight: Number,
    material: String,
    careInstructions: String,
    seoTitle: String,
    seoDescription: String,
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Date.now();
  }
  if (this.reviews.length > 0) {
    this.numReviews = this.reviews.length;
    this.avgRating =
      this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
  }
  next();
});

productSchema.virtual('discountPercent').get(function () {
  if (this.comparePrice && this.comparePrice > this.price) {
    return Math.round(((this.comparePrice - this.price) / this.comparePrice) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
