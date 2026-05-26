const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;