const Notification = require('../models/Notification');
const User = require('../models/User');
const Issue = require('../models/Issue');
const {
  sendAdminNewReportEmail,
  sendCitizenSubmissionEmail,
  sendCitizenStatusUpdateEmail
} = require('./emailService');

/**
 * Creates a notification for a specific recipient.
 */
const createNotification = async ({
  recipient,
  sender,
  issue,
  type = 'STATUS_CHANGED',
  title,
  message,
  link = ''
}) => {
  try {
    if (!recipient || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      issue,
      type,
      title,
      message,
      link
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

/**
 * Broadcasts a notification to all users with the 'admin' role,
 * and sends an email alert via Resend when a new report is submitted.
 */
const notifyAllAdmins = async ({
  sender,
  issue,
  type = 'ISSUE_SUBMITTED',
  title,
  message,
  link = ''
}) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id email name');
    if (!admins || admins.length === 0) {
      return [];
    }

    const notificationsToInsert = admins.map((adminUser) => ({
      recipient: adminUser._id,
      sender,
      issue,
      type,
      title,
      message,
      link: link || (issue ? `/admin/issues/${issue}` : '/admin')
    }));

    const createdNotifications = await Notification.insertMany(notificationsToInsert);

    // Asynchronously dispatch Resend email alert to administrators
    if (type === 'ISSUE_SUBMITTED' && issue) {
      (async () => {
        try {
          const issueDoc = typeof issue === 'object' && issue.title
            ? issue
            : await Issue.findById(issue);

          if (!issueDoc) return;

          let citizenName = 'A citizen';
          if (sender) {
            const senderUser = await User.findById(sender).select('name');
            if (senderUser) citizenName = senderUser.name;
          }

          // Send to admin email (or configured alert email)
          const adminEmail = admins[0]?.email || process.env.ADMIN_ALERT_EMAIL || 'sonumandalsmve@gmail.com';
          await sendAdminNewReportEmail({
            adminEmail,
            issue: issueDoc,
            citizenName
          });
        } catch (emailErr) {
          console.error('[NotificationService] Admin email delivery failed:', emailErr.message);
        }
      })().catch(err => console.error('[NotificationService] Uncaught admin email error:', err.message));
    }

    return createdNotifications;
  } catch (error) {
    console.error('Error notifying admins:', error.message);
    return [];
  }
};

/**
 * Notifies reporting citizen with in-app notification + Resend email on each step.
 */
const notifyCitizen = async ({
  citizenId,
  sender,
  issue,
  type = 'STATUS_CHANGED',
  title,
  message,
  link = ''
}) => {
  try {
    if (!citizenId) return null;

    // Avoid self-notification if sender and citizen are identical
    if (sender && sender.toString() === citizenId.toString()) {
      return null;
    }

    const createdNotif = await createNotification({
      recipient: citizenId,
      sender,
      issue,
      type,
      title,
      message,
      link: link || (issue ? `/issues/${issue}` : '/dashboard')
    });

    // Asynchronously dispatch Resend status update email to the citizen
    if (issue) {
      (async () => {
        try {
          const [citizenUser, issueDoc] = await Promise.all([
            User.findById(citizenId).select('name email'),
            typeof issue === 'object' && issue.title ? issue : Issue.findById(issue)
          ]);

          if (!citizenUser || !issueDoc) return;

          if (type === 'ISSUE_SUBMITTED') {
            await sendCitizenSubmissionEmail({
              citizenEmail: citizenUser.email,
              citizenName: citizenUser.name,
              issue: issueDoc
            });
          } else {
            await sendCitizenStatusUpdateEmail({
              citizenEmail: citizenUser.email,
              citizenName: citizenUser.name,
              issue: issueDoc,
              newStatus: issueDoc.status || 'Updated',
              remarks: message,
              department: issueDoc.assignedDepartment,
              resolutionDescription: issueDoc.resolutionDescription,
              resolutionImageUrl: issueDoc.resolutionImageUrl
            });
          }
        } catch (emailErr) {
          console.error('[NotificationService] Citizen email delivery failed:', emailErr.message);
        }
      })().catch(err => console.error('[NotificationService] Uncaught citizen email error:', err.message));
    }

    return createdNotif;
  } catch (error) {
    console.error('Error notifying citizen:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
  notifyAllAdmins,
  notifyCitizen
};

