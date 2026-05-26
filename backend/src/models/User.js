const db = require('../config/database');

const User = {
  // Create user
  async create(userData) {
    const { name, email, password, phone, district, role = 'technician' } = userData;
    
    const result = await db.query(
      `INSERT INTO users (name, email, password, phone, district, role) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, role, phone, district, join_date, status`,
      [name, email, password, phone, district, role]
    );
    return result.rows[0];
  },

  // Find user by email
  async findByEmail(email) {
    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0];
  },

  // Find user by id
  async findById(id) {
    const result = await db.query(
      `SELECT id, name, email, role, phone, district, status, join_date, last_login, created_at 
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  },

  // Get all technicians - ADD THIS FUNCTION
  async getAllTechnicians() {
    const result = await db.query(
      `SELECT id, name, email, phone, district, status, join_date 
       FROM users WHERE role = 'technician' 
       ORDER BY created_at DESC`
    );
    return result.rows;
  },

  // Update user
  async update(id, userData) {
    const { name, phone, district, status } = userData;
    const result = await db.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           district = COALESCE($3, district),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, role, phone, district, status`,
      [name, phone, district, status, id]
    );
    return result.rows[0];
  },

  // Update last login
  async updateLastLogin(id) {
    await db.query(
      `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    );
  },

  // Update password
  async updatePassword(id, newPassword) {
    await db.query(
      `UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newPassword, id]
    );
  },

  // Delete user
  async delete(id) {
    await db.query(`DELETE FROM users WHERE id = $1`, [id]);
  },

  // Verify password
  async verifyPassword(user, plainPassword) {
    if (!user || !user.password) {
      return false;
    }
    return user.password === plainPassword;
  },
};

module.exports = User;