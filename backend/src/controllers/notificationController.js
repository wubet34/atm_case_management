const db = require('../config/database');

// Helper to emit real-time notification
const emitNotification = (io, userId, notification) => {
  console.log(`📤 Emitting notification to user ${userId}:`, notification);
  io.to(`user_${userId}`).emit('new-notification', notification);
};

const createNotification = async (userId, type, title, message, caseId = null) => {
  console.log(`📝 Creating notification for user ${userId}:`, { type, title, message });
  
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, case_id, created_at) 
     VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
     RETURNING *`,
    [userId, type, title, message, caseId]
  );
  
  console.log(`✅ Notification created with ID: ${result.rows[0].id}`);
  return result.rows[0];
};

const getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await db.query(`UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`, 
      [req.params.id, req.user.id]);
    
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('unread-count-update', { 
      unreadCount: parseInt(countResult.rows[0].count) 
    });
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await db.query(`UPDATE notifications SET read = true WHERE user_id = $1`, [req.user.id]);
    
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('unread-count-update', { unreadCount: 0 });
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await db.query(`DELETE FROM notifications WHERE id = $1 AND user_id = $2`, 
      [req.params.id, req.user.id]);
    
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('unread-count-update', { 
      unreadCount: parseInt(countResult.rows[0].count) 
    });
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    await db.query(`DELETE FROM notifications WHERE user_id = $1`, [req.user.id]);
    
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('unread-count-update', { unreadCount: 0 });
    
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
  emitNotification,
};