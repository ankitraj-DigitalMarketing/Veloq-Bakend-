const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');

exports.createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  // Validate stock and compute prices
  let subtotal = 0;
  const orderItems = [];
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });

    const variant = product.variants.find(
      (v) => v.size === item.size && v.color === item.color
    );
    if (!variant || variant.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.name} (${item.size}, ${item.color})`,
      });
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: product.price,
    });
    subtotal += product.price * item.quantity;
  }

  const settings = await Settings.findOne() || {};
  const freeShippingThreshold = settings.freeShippingThreshold || 999;
  const shippingCharge = subtotal >= freeShippingThreshold ? 0 : (settings.shippingCharge || 99);
  const gstRate = settings.gstRate || 18;

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (coupon) {
      const validity = coupon.isValid(subtotal);
      if (validity.valid) {
        discount = coupon.calculateDiscount(subtotal);
        appliedCoupon = coupon._id;
      }
    }
  }

  const taxableAmount = subtotal - discount + shippingCharge;
  const gst = Math.round((taxableAmount * gstRate) / (100 + gstRate));
  const total = subtotal - discount + shippingCharge;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCharge,
    discount,
    gst,
    total,
    coupon: appliedCoupon,
    couponCode: couponCode?.toUpperCase(),
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    orderStatus: 'pending',
  });

  // Decrement stock
  for (const item of items) {
    await Product.updateOne(
      { _id: item.product, 'variants.size': item.size, 'variants.color': item.color },
      { $inc: { 'variants.$.stock': -item.quantity } }
    );
  }

  // Increment coupon usage
  if (appliedCoupon) {
    await Coupon.findByIdAndUpdate(appliedCoupon, {
      $inc: { usedCount: 1 },
      $push: { usedBy: req.user._id },
    });
  }

  res.status(201).json({ success: true, order });
};

exports.getMyOrders = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate('items.product', 'name images');

  res.json({ success: true, orders, total, page: Number(page), pages: Math.ceil(total / limit) });
};

exports.getOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('items.product', 'name images slug');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, order });
};

exports.cancelOrder = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (!['pending', 'confirmed'].includes(order.orderStatus)) {
    return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
  }
  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product, 'variants.size': item.size, 'variants.color': item.color },
      { $inc: { 'variants.$.stock': item.quantity } }
    );
  }
  res.json({ success: true, order });
};

exports.applyCoupon = async (req, res) => {
  const { code, subtotal } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

  const validity = coupon.isValid(subtotal);
  if (!validity.valid) return res.status(400).json({ success: false, message: validity.message });

  const discount = coupon.calculateDiscount(subtotal);
  res.json({ success: true, discount, coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue } });
};
