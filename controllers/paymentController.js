const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createRazorpayOrder = async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  const razorpay = getRazorpay();
  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString() },
  });

  order.razorpayOrderId = rzpOrder.id;
  await order.save();

  res.json({
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    orderNumber: order.orderNumber,
  });
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
    },
    { new: true }
  );

  res.json({ success: true, order });
};

exports.razorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = req.body;
  if (event.event === 'payment.captured') {
    const paymentId = event.payload.payment.entity.id;
    const rzpOrderId = event.payload.payment.entity.order_id;
    await Order.findOneAndUpdate(
      { razorpayOrderId: rzpOrderId },
      { razorpayPaymentId: paymentId, paymentStatus: 'paid', orderStatus: 'confirmed' }
    );
  }
  res.json({ status: 'ok' });
};
