const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    type: {
      type: String,
      enum: [
        'ISSUE_SUBMITTED',
        'STATUS_CHANGED',
        'ISSUE_ASSIGNED',
        'ISSUE_IN_PROGRESS',
        'ISSUE_RESOLVED',
        'ISSUE_REJECTED',
        'ISSUE_CONFIRMED',
        'ADMIN_REMARK',
      ],
      default: 'STATUS_CHANGED',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String, // e.g. "/issues/..." or "/admin/issues/..."
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
