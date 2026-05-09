const router = require('express').Router();
const { applyCoupon } = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/validate', protect, applyCoupon);

module.exports = router;
