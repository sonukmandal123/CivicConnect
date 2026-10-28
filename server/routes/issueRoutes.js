const express = require('express');
const router = express.Router();
const { 
  createIssue, 
  getMyIssues, 
  getIssueById, 
  getAllIssues, 
  updateIssueStatus,
  getMapIssues,
  testAiAnalysis,
  confirmIssue,
  getIssuePriority,
  getNearbyIssues
} = require('../controllers/issueController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/issues
// @desc    Get all issues
// @access  Private/Admin
router.get('/', protect, admin, getAllIssues);

// @route   GET /api/issues/map
// @desc    Get issues for map display
// @access  Public
router.get('/map', getMapIssues);

// @route   GET /api/issues/nearby
// @desc    Get nearby issues by GPS coordinates using MongoDB 2dsphere index
// @access  Public
router.get('/nearby', getNearbyIssues);

// @route   POST /api/issues/test-ai
// @desc    Test AI analysis independently
// @access  Private/Admin
router.post('/test-ai', protect, admin, testAiAnalysis);

// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private (Only logged-in citizens)
// Notice how we chain middlewares: protect verifies the user, then upload.single('image') handles the file
router.post('/', protect, upload.single('image'), createIssue);

// @route   GET /api/issues/my
// @desc    Get logged in user's issues
// @access  Private
router.get('/my', protect, getMyIssues);

// @route   GET /api/issues/:id
// @desc    Get single issue by ID
// @access  Public
router.get('/:id', getIssueById);

// @route   GET /api/issues/:id/priority
// @desc    Get priority score and breakdown for an issue
// @access  Public
router.get('/:id/priority', getIssuePriority);

// @route   PUT /api/issues/:id/confirm
// @desc    Confirm an issue
// @access  Private
router.put('/:id/confirm', protect, confirmIssue);

// @route   PUT /api/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/:id/status', protect, admin, updateIssueStatus);

module.exports = router;
