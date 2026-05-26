const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const db = require('../config/database');
const bcrypt = require('bcryptjs');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    // Get user from database
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    console.log('User found:', user.email, user.role);
    console.log('Stored password type:', user.password.startsWith('$2') ? 'HASHED' : 'PLAIN');
    
    if (user.status !== 'Active') {
      console.log('User not active:', email);
      return res.status(401).json({ success: false, message: 'Account is not active' });
    }
    
    // Verify password - handles both plain text and bcrypt hashed
    let isPasswordValid = false;
    
    // Check if stored password is bcrypt hashed (starts with $2)
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      // Bcrypt hashed password
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Bcrypt comparison result:', isPasswordValid);
    } else {
      // Plain text password comparison
      isPasswordValid = user.password === password;
      console.log('Plain text comparison result:', isPasswordValid);
    }
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Update last login
    await User.updateLastLogin(user.id);
    
    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, ip_address) VALUES ($1, $2, $3)`,
      [user.id, 'LOGIN', req.ip]
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('Login successful for:', email);
    
    res.json({
      success: true,
      token: generateToken(user.id),
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register user (Admin only)
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, district, role = 'technician' } = req.body;
    
    console.log('Registering new user:', { name, email, role });
    
    // Check if user exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with hashed password
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      district,
      role,
    });
    
    // Log activity
    await db.query(
      `INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [req.user.id, 'REGISTER_USER', JSON.stringify({ newUser: email, role })]
    );
    
    console.log('User registered successfully:', email);
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, district } = req.body;
    const user = await User.update(req.user.id, { name, phone, district });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByEmail(req.user.email);
    
    // Verify current password
    let isPasswordValid = false;
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      isPasswordValid = user.password === currentPassword;
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await User.updatePassword(req.user.id, hashedPassword);
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
};