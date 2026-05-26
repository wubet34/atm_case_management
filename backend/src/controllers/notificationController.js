const db = require('../config/database');

// Track recently sent notifications to prevent duplicates
const recentNotifications = new Map();

// Helper to emit real-time notification
const emitNotification = (io, userId, notification) => {
  console.log(`📤 Emitting notification to user ${userId}:`, notification);
  
  const key = `${userId}_${notification.id}`;
  if (recentNotifications.has(key)) {
    const lastSent = recentNotifications.get(key);
    if (Date.now() - lastSent < 2000) {
      console.log(`⚠️ Skipping duplicate notification emit for ${key}`);
      return;
    }
  }
  
  recentNotifications.set(key, Date.now());
  
  for (const [k, timestamp] of recentNotifications.entries()) {
    if (Date.now() - timestamp > 5000) {
      recentNotifications.delete(k);
    }
  }
  
  io.to(`user_${userId}`).emit('new-notification', notification);
};

const createNotification = async (userId, type, title, message, caseId = null) => {
  console.log(`📝 Creating notification for user ${userId}:`, { type, title, message });
  
  // Use NOW() for current timestamp
  const result = await db.query(
    `INSERT INTO notifications (user_id, type, title, message, case_id, created_at, updated_at) 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
     RETURNING *`,
    [userId, type, title, message, caseId]
  );
  
  console.log(`✅ Notification created with ID: ${result.rows[0].id}, created_at: ${result.rows[0].created_at}`);
  return result.rows[0];
};

const getNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, user_id, type, title, message, case_id, read, 
              created_at, updated_at, reviewed_by, reviewed_at
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [req.user.id]
    );
    
    // Format dates to ISO string for consistent frontend handling
    const formattedRows = result.rows.map(row => ({
      ...row,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      reviewed_at: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read = true, updated_at = NOW() 
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    
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
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await db.query(
      `UPDATE notifications SET read = true, updated_at = NOW() 
       WHERE user_id = $1 AND read = false`,
      [req.user.id]
    );
    
    const io = req.app.get('io');
    io.to(`user_${req.user.id}`).emit('unread-count-update', { unreadCount: 0 });
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
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
    console.error('Delete notification error:', error);
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
    console.error('Clear notifications error:', error);
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