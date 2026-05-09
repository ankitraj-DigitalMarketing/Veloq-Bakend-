const jwt = require('jsonwebtoken');

exports.generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

exports.generateResetToken = () => {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes
  return { resetToken, hashedToken, expiry };
};
