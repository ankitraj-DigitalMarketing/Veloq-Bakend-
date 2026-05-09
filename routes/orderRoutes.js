const router = require('express').Router();
const { createOrder, getMyOrders, getOrder, cancelOrder, applyCoupon } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);
router.post('/apply-coupon', protect, applyCoupon);

module.exports = router;
