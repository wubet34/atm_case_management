const db = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Forgot password - show reset link directly
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const user = await db.query(`SELECT id, email, name FROM users WHERE email = $1`, [email]);
    
    if (user.rows.length === 0) {
      return res.json({ 
        success: true, 
        message: 'User not found. Please check your email.' 
      });
    }
    
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      `UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3`,
      [resetToken, resetExpires, user.rows[0].id]
    );
    
    const clientUrl = process.env.CLIENT_URL || 'https://atm-case-management.vercel.app';
    const resetLink = `${clientUrl}/reset-password/${resetToken}`;
    
    // Return the reset link directly in the response
    res.json({ 
      success: true, 
      message: 'Password reset link generated successfully',
      resetLink: resetLink,
      instruction: 'Click the link below to reset your password'
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
    
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
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
    
    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await db.query(
      `SELECT id, email FROM users WHERE reset_token = $1 AND reset_expires > NOW()`,
      [token]
    );
    
    if (user.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    
    res.json({ success: true, message: 'Token is valid' });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { forgotPassword, resetPassword, verifyResetToken };