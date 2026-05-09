const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = 'mongodb+srv://jaipurankitraj_db_user:ZNDbWrc7YRdtFpBz@cluster0.jko9hzf.mongodb.net/veloqdb?retryWrites=true&w=majority&appName=Cluster0';

const ADMIN_EMAIL    = 'jaipurankitraj@gmail.com';
const ADMIN_PASSWORD = 'Ankit@Raj123';
const ADMIN_NAME     = 'Admin';

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  const existing = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

  if (existing) {
    existing.role     = 'admin';
    existing.name     = ADMIN_NAME;
    existing.password = ADMIN_PASSWORD;
    await existing.save();
    console.log('✅ Admin user updated — email:', ADMIN_EMAIL);
  } else {
    await User.create({
      name:     ADMIN_NAME,
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role:     'admin',
    });
    console.log('✅ Admin user created — email:', ADMIN_EMAIL);
  }

  await mongoose.disconnect();
  console.log('Done! Ab /admin pe login karo.');
}

run().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
