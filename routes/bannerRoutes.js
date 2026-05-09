const express = require('express');
const router = express.Router();
const { getActiveBanners, getAllBanners, upsertBanner, deleteBanner } = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/auth');

router.get('/', getActiveBanners);
router.get('/all', protect, admin, getAllBanners);
router.put('/:position', protect, admin, upsertBanner);
router.delete('/:position', protect, admin, deleteBanner);

module.exports = router;
