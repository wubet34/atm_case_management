const db = require('../config/database');

const ActivityLog = {
  // Create activity log
  async create(userId, action, details = {}, ipAddress = null) {
    const result = await db.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, action, JSON.stringify(details), ipAddress]
    );
    return result.rows[0];
  },

  // Get all activity logs
  async getAll(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  },

  // Get logs by user
  async getByUserId(userId, limit = 50) {
    const result = await db.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  // Get logs by action type
  async getByAction(action, limit = 50) {
    const result = await db.query(
      `SELECT al.*, u.name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.action = $1
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [action, limit]
    );
    return result.rows;
  },

  // Get logs by date range
  async getByDateRange(startDate, endDate, limit = 100) {
    const result = await db.query(
      `SELECT al.*, u.name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.created_at BETWEEN $1 AND $2
       ORDER BY al.created_at DESC
       LIMIT $3`,
      [startDate, endDate, limit]
    );
    return result.rows;
  },

  // Delete old logs (older than days)
  async deleteOldLogs(days = 30) {
    const result = await db.query(
      `DELETE FROM activity_logs 
       WHERE created_at < NOW() - INTERVAL '${days} days'
       RETURNING *`
    );
    return result.rowCount;
  },

  // Get recent activities for dashboard
  async getRecentActivities(limit = 10) {
    const result = await db.query(
      `SELECT al.*, u.name as user_name, u.role as user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  },

  // Get activity summary by action type
  async getActionSummary(startDate, endDate) {
    const result = await db.query(
      `SELECT action, COUNT(*) as count
       FROM activity_logs
       WHERE created_at BETWEEN $1 AND $2
       GROUP BY action
       ORDER BY count DESC`,
      [startDate, endDate]
    );
    return result.rows;
  }
};

module.exports = ActivityLog;