const router = require('express').Router();
const { createRazorpayOrder, verifyPayment, razorpayWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/webhook', razorpayWebhook);

module.exports = router;
