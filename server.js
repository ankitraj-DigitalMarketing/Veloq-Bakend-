const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Trust reverse proxy (Render, Vercel) so req.protocol returns https correctly
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// CORS — allow Vercel frontend + localhost dev
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
    // Allow all Vercel deployments
    if (origin.includes('vercel.app')) return callback(null, true);
    // Allow custom domain if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return callback(null, true);
    // Allow everything else for now (can restrict later)
    return callback(null, true);
  },
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ONE-TIME ADMIN SETUP — DELETE THIS ROUTE AFTER USE
app.get('/api/setup-admin', async (req, res) => {
  if (req.query.key !== 'VELOQ_ADMIN_SETUP_2024') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const User = require('./models/User');
    let user = await User.findOne({ email: 'jaipurankitraj@gmail.com' }).select('+password');
    if (user) {
      user.role     = 'admin';
      user.password = 'Ankit@Raj123';
      await user.save();
      return res.json({ success: true, message: 'Admin user updated successfully!' });
    }
    await User.create({ name: 'Admin', email: 'jaipurankitraj@gmail.com', password: 'Ankit@Raj123', role: 'admin' });
    res.json({ success: true, message: 'Admin user created successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Auto-create/fix admin user on every server start
async function ensureAdminUser() {
  try {
    const User = require('./models/User');
    let admin = await User.findOne({ email: 'jaipurankitraj@gmail.com' }).select('+password');
    if (!admin) {
      await User.create({ name: 'Admin', email: 'jaipurankitraj@gmail.com', password: 'Ankit@Raj123', role: 'admin' });
      console.log('✅ Admin user created');
    } else {
      // Always ensure correct role + password on every restart
      admin.role     = 'admin';
      admin.password = 'Ankit@Raj123';
      await admin.save();
      console.log('✅ Admin user verified and ready');
    }
  } catch (e) {
    console.error('Admin setup error:', e.message);
  }
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect('mongodb+srv://jaipurankitraj_db_user:ZNDbWrc7YRdtFpBz@cluster0.jko9hzf.mongodb.net/veloqdb?retryWrites=true&w=majority&appName=Cluster0')
  .then(async () => {
    console.log('✅ MongoDB connected');
    await ensureAdminUser();
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
