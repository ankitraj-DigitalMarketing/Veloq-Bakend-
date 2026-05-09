const mongoose = require('mongoose');
const slugify = require('slugify');

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: String,
    image: String,
    bannerImage: String,
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    isAutomatic: { type: Boolean, default: false },
    conditions: [
      {
        field: String,
        operator: String,
        value: String,
      },
    ],
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: String,
    seoDescription: String,
  },
  { timestamps: true }
);

collectionSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);
