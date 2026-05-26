const db = require('../config/database');

const Notification = {
  // Create notification
  async create(userId, type, title, message, caseId = null) {
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, case_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, type, title, message, caseId]
    );
    return result.rows[0];
  },

  // Get notifications for user
  async getByUserId(userId, limit = 50, includeRead = true) {
    let query = `
      SELECT n.*, c.case_id as case_code
      FROM notifications n
      LEFT JOIN cases c ON n.case_id = c.id
      WHERE n.user_id = $1
    `;
    const params = [userId];
    
    if (!includeRead) {
      query += ` AND n.read = false`;
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT $2`;
    params.push(limit);
    
    const result = await db.query(query, params);
    return result.rows;
  },

  // Get unread count
  async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  // Mark as read
  async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  },

  // Mark all as read for user
  async markAllAsRead(userId) {
    const result = await db.query(
      `UPDATE notifications 
       SET read = true 
       WHERE user_id = $1 AND read = false
       RETURNING *`,
      [userId]
    );
    return result.rows;
  },

  // Delete notification
  async delete(notificationId, userId) {
    const result = await db.query(
      `DELETE FROM notifications 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  },

  // Delete all notifications for user
  async deleteAll(userId) {
    const result = await db.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );
    return result.rowCount;
  },

  // Create bulk notifications for multiple users
  async createBulk(userIds, type, title, message, caseId = null) {
    const results = [];
    for (const userId of userIds) {
      const notification = await this.create(userId, type, title, message, caseId);
      results.push(notification);
    }
    return results;
  },

  // Get notification by id
  async getById(notificationId) {
    const result = await db.query(
      `SELECT n.*, u.name as user_name, c.case_id as case_code
       FROM notifications n
       LEFT JOIN users u ON n.user_id = u.id
       LEFT JOIN cases c ON n.case_id = c.id
       WHERE n.id = $1`,
      [notificationId]
    );
    return result.rows[0];
  }
};

module.exports = Notification;