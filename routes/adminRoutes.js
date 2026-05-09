const router = require('express').Router();
const {
  getDashboard, getAllOrders, getOrderDetail, updateOrderStatus,
  getAllCustomers, toggleCustomerBlock,
  createCoupon, getCoupons, updateCoupon, deleteCoupon,
  getSettings, updateSettings,
  getAllReviews, deleteReview, toggleVerifiedReview,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

router.use(protect, admin);

router.get('/dashboard', getDashboard);

router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderDetail);
router.put('/orders/:id/status', updateOrderStatus);

router.get('/customers', getAllCustomers);
router.put('/customers/:id/toggle-block', toggleCustomerBlock);

router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);

router.get('/reviews', getAllReviews);
router.delete('/reviews/:productId/:reviewId', deleteReview);
router.put('/reviews/:productId/:reviewId/verify', toggleVerifiedReview);

module.exports = router;
