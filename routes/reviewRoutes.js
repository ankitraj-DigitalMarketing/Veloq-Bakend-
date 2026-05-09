const router = require('express').Router();
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

router.delete('/:productId/:reviewId', protect, admin, async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  product.reviews = product.reviews.filter((r) => r._id.toString() !== req.params.reviewId);
  await product.save();
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = router;
