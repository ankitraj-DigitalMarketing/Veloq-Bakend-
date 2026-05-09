const router = require('express').Router();
const upload = require('../middleware/upload');
const { protect, admin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Upload buffer — Cloudinary (production) or disk (local dev)
async function uploadBuffer(buffer, mimetype, originalname) {
  if (useCloudinary) {
    const b64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'veloq',
      resource_type: 'image',
    });
    return result.secure_url;
  }

  // Local dev fallback — save to disk
  const uploadDir = path.join(__dirname, '../uploads/products');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const ext = path.extname(originalname) || '.jpg';
  const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/products/${filename}`;
}

// POST /api/upload/products — product images (multiple)
router.post('/products', protect, admin, upload.array('images', 10), async (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  try {
    const images = await Promise.all(
      req.files.map(async (file) => ({
        url: await uploadBuffer(file.buffer, file.mimetype, file.originalname),
        alt: file.originalname,
      }))
    );
    res.json({ success: true, images });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// POST /api/upload/single — single image (banner, collection, etc.)
router.post('/single', protect, admin, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const url = await uploadBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ success: true, url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

module.exports = router;
