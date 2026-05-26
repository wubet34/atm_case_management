const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, district } = req.body;

    // Check if user exists
    const existingUser = await db.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.query(
      `INSERT INTO users (name, email, password, role, phone, district, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'Active', NOW(), NOW())
       RETURNING id, name, email, role, phone, district`,
      [name, email, hashedPassword, role || 'technician', phone, district]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for email:', email);
    
    // Get user with password
    const result = await db.query(
      `SELECT id, name, email, password, role, phone, district, status 
       FROM users 
       WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Remove password from user object
    delete user.password;
    
    // Generate token
    const token = generateToken(user.id, user.email, user.role);
    
    console.log('Login successful for:', email);
    
    res.json({
      success: true,
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, role, phone, district, status, join_date, created_at
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, district } = req.body;
    
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           district = COALESCE($3, district),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, role, phone, district`,
      [name, phone, district, req.user.id]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get current password from database
    const result = await db.query(
      `SELECT password FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, req.user.id]
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
};