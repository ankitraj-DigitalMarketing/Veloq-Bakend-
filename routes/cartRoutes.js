// Cart is managed client-side via Zustand. This route provides server-side cart sync.
const router = require('express').Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Validate cart items (check stock)
router.post('/validate', protect, async (req, res) => {
  const { items } = req.body;
  const validated = [];
  let hasChanges = false;

  for (const item of items) {
    const product = await Product.findById(item.product).select('name price images variants status');
    if (!product || product.status !== 'active') {
      hasChanges = true;
      continue;
    }
    const variant = product.variants.find((v) => v.size === item.size && v.color === item.color);
    const availableQty = variant?.stock || 0;
    if (availableQty === 0) {
      hasChanges = true;
      continue;
    }
    const quantity = Math.min(item.quantity, availableQty);
    if (quantity !== item.quantity) hasChanges = true;
    validated.push({ ...item, quantity, price: product.price, name: product.name, image: product.images[0]?.url });
  }
  res.json({ success: true, items: validated, hasChanges });
});

module.exports = router;
