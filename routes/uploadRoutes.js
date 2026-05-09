const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');
const path = require('path');

router.post('/products', protect, admin, upload.array('images', 10), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  const urls = req.files.map((file) => ({
    url: `/uploads/products/${file.filename}`,
    alt: file.originalname,
  }));
  res.json({ success: true, images: urls });
});

router.post('/single', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/products/${req.file.filename}` });
});

module.exports = router;
