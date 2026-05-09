const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const Collection = require('../models/Collection');

exports.getDashboard = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrders,
    totalRevenue,
    totalProducts,
    totalCustomers,
    monthOrders,
    lastMonthRevenue,
    recentOrders,
    lowStockProducts,
    topProducts,
  ] = await Promise.all([
    Order.countDocuments({ orderStatus: { $ne: 'cancelled' } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Product.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'customer' }),
    Order.countDocuments({ createdAt: { $gte: startOfMonth }, orderStatus: { $ne: 'cancelled' } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email'),
    Product.find({ 'variants.stock': { $lt: 5 }, status: 'active' })
      .limit(10)
      .select('name images variants'),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
    ]),
  ]);

  // Revenue chart data (last 30 days)
  const revenueChart = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalProducts,
      totalCustomers,
      monthOrders,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
    },
    recentOrders,
    lowStockProducts,
    topProducts,
    revenueChart,
  });
};

exports.getAllOrders = async (req, res) => {
  const { page = 1, limit = 20, status, search, paymentStatus } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('user', 'name email phone');

  res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

exports.updateOrderStatus = async (req, res) => {
  const { orderStatus, trackingNumber, courierName, notes } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus, trackingNumber, courierName, notes, ...(orderStatus === 'delivered' && { deliveredAt: new Date() }) },
    { new: true }
  );
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

exports.getAllCustomers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const query = { role: 'customer' };
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  const total = await User.countDocuments(query);
  const customers = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .select('-password');
  res.json({ success: true, customers, total });
};

exports.toggleCustomerBlock = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isBlocked = !user.isBlocked;
  await user.save();
  res.json({ success: true, isBlocked: user.isBlocked });
};

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
};

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
};

exports.updateCoupon = async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
  res.json({ success: true, coupon });
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
};

exports.getAllReviews = async (req, res) => {
  const { page = 1, limit = 20, rating, verified } = req.query;
  const match = {};
  if (rating) match['reviews.rating'] = Number(rating);
  if (verified === 'true') match['reviews.isVerifiedPurchase'] = true;

  const skip = (page - 1) * limit;
  const products = await Product.find({ 'reviews.0': { $exists: true } })
    .select('name images reviews slug')
    .lean();

  const allReviews = [];
  products.forEach(p => {
    p.reviews.forEach(r => {
      if (rating && r.rating !== Number(rating)) return;
      if (verified === 'true' && !r.isVerifiedPurchase) return;
      allReviews.push({ ...r, productId: p._id, productName: p.name, productSlug: p.slug, productImage: p.images?.[0]?.url });
    });
  });

  allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = allReviews.length;
  const paginated = allReviews.slice(skip, skip + Number(limit));
  res.json({ success: true, reviews: paginated, total, pages: Math.ceil(total / limit) });
};

exports.deleteReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  product.reviews = product.reviews.filter(r => r._id.toString() !== reviewId);
  await product.save();
  res.json({ success: true, message: 'Review deleted' });
};

exports.toggleVerifiedReview = async (req, res) => {
  const { productId, reviewId } = req.params;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  const review = product.reviews.id(reviewId);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  review.isVerifiedPurchase = !review.isVerifiedPurchase;
  await product.save();
  res.json({ success: true, isVerified: review.isVerifiedPurchase });
};

exports.getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ success: true, settings });
};

exports.updateSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(req.body);
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }
  res.json({ success: true, settings });
};
