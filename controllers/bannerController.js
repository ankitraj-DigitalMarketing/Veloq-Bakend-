const Banner = require('../models/Banner');

// @Public  GET /api/banners
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort('position');
    res.json({ banners });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @Admin   GET /api/banners/all
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort('position');
    // Return array of 4 slots (fill missing positions with null)
    const slots = [1, 2, 3, 4].map((pos) => banners.find((b) => b.position === pos) || null);
    res.json({ banners: slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @Admin   PUT /api/banners/:position  (upsert by position 1-4)
exports.upsertBanner = async (req, res) => {
  try {
    const position = Number(req.params.position);
    if (position < 1 || position > 4) return res.status(400).json({ message: 'Position must be 1-4' });

    const banner = await Banner.findOneAndUpdate(
      { position },
      { ...req.body, position },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ banner });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @Admin   DELETE /api/banners/:position
exports.deleteBanner = async (req, res) => {
  try {
    const position = Number(req.params.position);
    await Banner.findOneAndDelete({ position });
    res.json({ message: 'Banner removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
