const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
  updateIssueStatus,
  addAdminRemark,
  getIssueHistory,
  getDepartments,
  assignIssue,
  markInProgress,
  resolveIssue,
  getAdminIssues,
  getSingleAdminIssue,
  markDuplicateIssue
} = require('../controllers/adminController');

const {
  getFullAnalytics,
  getAnalyticsSummary,
  getCategoryAnalytics,
  getStatusAnalytics,
  getSeverityAnalytics,
  getPriorityAnalytics,
  getTimelineAnalytics,
  getResolutionAnalytics,
  getCommunityAnalytics,
  getAiAnalytics
} = require('../controllers/analyticsController');

// All admin routes require JWT protection and Admin role
router.use(protect, admin);

// Analytics endpoints (MongoDB aggregation pipelines)
router.get('/analytics', getFullAnalytics);
router.get('/analytics/summary', getAnalyticsSummary);
router.get('/analytics/categories', getCategoryAnalytics);
router.get('/analytics/status', getStatusAnalytics);
router.get('/analytics/severity', getSeverityAnalytics);
router.get('/analytics/priority', getPriorityAnalytics);
router.get('/analytics/timeline', getTimelineAnalytics);
router.get('/analytics/resolution', getResolutionAnalytics);
router.get('/analytics/community', getCommunityAnalytics);
router.get('/analytics/ai', getAiAnalytics);

// Issue management (listing, pagination, filter, search, sort)
router.get('/issues', getAdminIssues);
router.get('/issues/:id', getSingleAdminIssue);
router.post('/issues/:id/duplicate', markDuplicateIssue);

// Department list
router.get('/departments', getDepartments);

// Status update with state machine validation
router.patch('/issues/:id/status', updateIssueStatus);
router.put('/issues/:id/status', updateIssueStatus);

// Department assignment
router.patch('/issues/:id/assign', assignIssue);
router.put('/issues/:id/assign', assignIssue);

// Transition to In Progress
router.patch('/issues/:id/in-progress', markInProgress);
router.put('/issues/:id/in-progress', markInProgress);

// Resolution with description & optional resolution image
router.post('/issues/:id/resolve', upload.single('image'), resolveIssue);

// Admin remarks
router.post('/issues/:id/remarks', addAdminRemark);

// Issue history/audit trail
router.get('/issues/:id/history', getIssueHistory);


module.exports = router;
