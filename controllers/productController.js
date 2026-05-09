const Product = require('../models/Product');
const Collection = require('../models/Collection');

exports.getProducts = async (req, res) => {
  const {
    page = 1, limit = 12, category, brand, minPrice, maxPrice,
    rating, size, color, sort = '-createdAt', search, status,
    featured, bestSeller, newArrival,
  } = req.query;

  const query = {};
  if (status) query.status = status;
  else query.status = 'active';

  if (category) query.category = category;
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (rating) query.avgRating = { $gte: Number(rating) };
  if (size) query['variants.size'] = size;
  if (color) query['variants.color'] = { $regex: color, $options: 'i' };
  if (featured === 'true') query.isFeatured = true;
  if (bestSeller === 'true') query.isBestSeller = true;
  if (newArrival === 'true') query.isNewArrival = true;
  if (search) query.$text = { $search: search };

  const sortOptions = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    rating: { avgRating: -1 },
    bestseller: { totalSold: -1 },
  };
  const sortQuery = sortOptions[sort] || { createdAt: -1 };

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('-reviews');

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  });
};

exports.getProduct = async (req, res) => {
  const product = await Product.findOne({
    $or: [{ slug: req.params.id }, { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }],
  }).populate('collections', 'name slug');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
};

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  if (req.body.collections?.length) {
    await Collection.updateMany(
      { _id: { $in: req.body.collections } },
      { $addToSet: { products: product._id } }
    );
  }
  res.status(201).json({ success: true, product });
};

exports.updateProduct = async (req, res) => {
  const oldProduct = await Product.findById(req.params.id).select('collections');
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const oldCols = (oldProduct?.collections || []).map(id => id.toString());
  const newCols = (req.body.collections || []).map(id => id.toString());
  const added   = newCols.filter(id => !oldCols.includes(id));
  const removed = oldCols.filter(id => !newCols.includes(id));
  if (added.length)   await Collection.updateMany({ _id: { $in: added } },   { $addToSet: { products: product._id } });
  if (removed.length) await Collection.updateMany({ _id: { $in: removed } }, { $pull:     { products: product._id } });

  res.json({ success: true, product });
};

exports.deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  await Collection.updateMany({ products: product._id }, { $pull: { products: product._id } });
  res.json({ success: true, message: 'Product deleted' });
};

exports.addReview = async (req, res) => {
  const { rating, comment, images } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed) {
    return res.status(400).json({ success: false, message: 'Already reviewed this product' });
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
    images: images || [],
  });
  await product.save();
  res.status(201).json({ success: true, message: 'Review added' });
};

exports.getRelatedProducts = async (req, res) => {
  const product = await Product.findById(req.params.id).select('category brand');
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const related = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    status: 'active',
  })
    .limit(8)
    .select('name slug images price comparePrice avgRating numReviews');

  res.json({ success: true, products: related });
};

exports.bulkAction = async (req, res) => {
  const { action, productIds } = req.body;
  if (action === 'delete') {
    await Product.deleteMany({ _id: { $in: productIds } });
  } else if (['active', 'draft', 'archived'].includes(action)) {
    await Product.updateMany({ _id: { $in: productIds } }, { status: action });
  }
  res.json({ success: true, message: `Bulk action '${action}' completed` });
};
