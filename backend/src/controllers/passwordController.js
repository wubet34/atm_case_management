const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Forgot password - send reset link
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await db.query(`SELECT id, email FROM users WHERE email = $1`, [email]);
    
    if (user.rows.length === 0) {
      // For security, still return success even if email not found
      return res.json({ success: true, message: 'If your email exists, you will receive a reset link' });
    }
    
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      `UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3`,
      [resetToken, resetExpires, user.rows[0].id]
    );
    
    // In production, send email here
    // For now, log the reset link
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    console.log('Reset link:', resetLink);
    
    res.json({ 
      success: true, 
      message: 'Password reset link has been sent to your email',
      resetLink // Remove in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const user = await db.query(
      `SELECT id, email FROM users WHERE reset_token = $1 AND reset_expires > NOW()`,
      [token]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      `UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2`,
      [hashedPassword, user.rows[0].id]
    );
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { forgotPassword, resetPassword };