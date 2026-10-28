const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');

// All notification routes require JWT authentication
router.use(protect);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.delete('/clear-all', clearAllNotifications);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
