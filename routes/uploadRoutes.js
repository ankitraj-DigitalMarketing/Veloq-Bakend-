const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Cloudinary setup (used when env vars are present)
let cloudinary = null;
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Upload a buffer — returns public URL
async function uploadBuffer(buffer, filename, req) {
  if (cloudinary) {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'veloq/products', resource_type: 'image', use_filename: false },
        (error, result) => { if (error) reject(error); else resolve(result); }
      ).end(buffer);
    });
    return result.secure_url;
  }

  // Fallback: disk storage (local dev only)
  const uploadDir = path.join(__dirname, '../uploads/products');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(filename)}`;
  fs.writeFileSync(path.join(uploadDir, uniqueName), buffer);
  const base = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/products/${uniqueName}`;
}

// POST /api/upload/products  — multiple images (product form)
router.post('/products', protect, admin, upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  try {
    const images = await Promise.all(
      req.files.map(async (file) => ({
        url: await uploadBuffer(file.buffer, file.originalname, req),
        alt: file.originalname,
      }))
    );
    res.json({ success: true, images });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// POST /api/upload/single  — single image (collection, banner, etc.)
router.post('/single', protect, admin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const url = await uploadBuffer(req.file.buffer, req.file.originalname, req);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

module.exports = router;
