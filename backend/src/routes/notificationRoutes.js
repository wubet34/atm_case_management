const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createTestNotification,
  debugNotifications,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Debug routes (use first to check what's happening)
router.get('/debug', debugNotifications);
router.post('/test', createTestNotification);

// Main routes
router.get('/', getNotifications);
router.put('/mark-all-read', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;