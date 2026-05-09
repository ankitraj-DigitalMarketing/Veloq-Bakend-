const router = require('express').Router();
const Settings = require('../models/Settings');

router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.findOne().select(
      'storeName announcementText announcementEnabled socialLinks metaTitle metaDescription ' +
      'contactEmail contactPhone address aboutText freeShippingThreshold shippingCharge ' +
      'facebookPixelId googleAdsId upiId upiName upiQrCode upiPaymentEnabled ' +
      'marqueeItems featureBar homepageShowNewArrivals homepageShowBestSellers ' +
      'homepageShowCollections homepageShowTrending homepageShowWhyUs homepageShowReviews'
    );
    res.json({ success: true, settings: settings || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
