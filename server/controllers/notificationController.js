const Notification = require('../models/Notification');

/**
 * @desc    Get logged-in user's notifications with unread count
 * @route   GET /api/notifications
 * @access  Private (Citizen or Admin)
 */
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .populate('sender', 'name email role')
        .populate('issue', 'title category status priorityLevel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
      Notification.countDocuments({ recipient: req.user._id })
    ]);

    res.json({
      success: true,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

/**
 * @desc    Mark all user's notifications as read
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
};

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error while deleting notification' });
  }
};

/**
 * @desc    Clear all notifications for current user
 * @route   DELETE /api/notifications/clear-all
 * @access  Private
 */
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.json({
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error while clearing notifications' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
};
