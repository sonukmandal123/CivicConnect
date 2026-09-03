const Issue = require('../models/Issue');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { title, description, category, severity } = req.body;

    // Validate text fields
    if (!title || !description || !category || !severity) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image of the issue' });
    }

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'civicconnect/issues',
    });

    // Delete the temporary file from our server's 'uploads' folder
    fs.unlinkSync(req.file.path);

    // Create the issue in MongoDB
    const issue = await Issue.create({
      title,
      description,
      category,
      severity,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      reportedBy: req.user._id, // Got this from the 'protect' middleware
      status: 'Submitted',
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error(error);
    // If something failed and the temp file still exists, clean it up
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error while creating issue' });
  }
};

// @desc    Get logged in user's issues
// @route   GET /api/issues/my
// @access  Private
const getMyIssues = async (req, res) => {
  try {
    // Find issues where reportedBy matches the logged-in user's ID
    const issues = await Issue.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching your issues' });
  }
};

// @desc    Get single issue by ID
// @route   GET /api/issues/:id
// @access  Private
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Security check: Only the user who created it (or an admin) can view it
    if (issue.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this issue' });
    }

    res.json(issue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching the issue' });
  }
};

// @desc    Get all issues (Admin only)
// @route   GET /api/issues
// @access  Private/Admin
const getAllIssues = async (req, res) => {
  try {
    // Admin gets all issues, sorted by newest first
    // We also populate the reportedBy field to get the user's name
    const issues = await Issue.find()
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching all issues' });
  }
};

// @desc    Update issue status (Admin only)
// @route   PUT /api/issues/:id/status
// @access  Private/Admin
const updateIssueStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Submitted', 'Under Review', 'Verified', 'Rejected', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.status = status;
    const updatedIssue = await issue.save();

    res.json(updatedIssue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
};

module.exports = {
  createIssue,
  getMyIssues,
  getIssueById,
  getAllIssues,
  updateIssueStatus,
};
