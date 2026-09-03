const express = require('express');
const router = express.Router();
const { 
  createIssue, 
  getMyIssues, 
  getIssueById, 
  getAllIssues, 
  updateIssueStatus 
} = require('../controllers/issueController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/issues
// @desc    Get all issues
// @access  Private/Admin
router.get('/', protect, admin, getAllIssues);

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
// @access  Private
router.get('/:id', protect, getIssueById);

// @route   PUT /api/issues/:id/status
// @desc    Update issue status
// @access  Private/Admin
router.put('/:id/status', protect, admin, updateIssueStatus);

module.exports = router;
