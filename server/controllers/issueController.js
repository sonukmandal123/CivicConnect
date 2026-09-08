const Issue = require('../models/Issue');
const { cloudinary } = require('../config/cloudinary');
const { analyzeIssueImage } = require('../services/aiService');
const fs = require('fs');

// @desc    Create a new issue
// @route   POST /api/issues
// @access  Private
const createIssue = async (req, res) => {
  try {
    const { title, description, category, severity, latitude, longitude } = req.body;

    // Validate text fields
    if (!title || !description || !category || !severity || !latitude || !longitude) {
      return res.status(400).json({ message: 'Please provide all required fields including location' });
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

    // Call AI Service
    let aiData = {};
    try {
      const analysis = await analyzeIssueImage(result.secure_url, category, description);
      if (analysis) {
        aiData = {
          aiConfidence: analysis.confidence,
          aiIssueType: analysis.issueType,
          problemDetected: analysis.problemDetected,
          aiExplanation: analysis.explanation,
        };
      }
    } catch (aiError) {
      console.error('AI Analysis failed during issue creation, proceeding without AI data:', aiError);
    }

    // Create the issue in MongoDB
    const issue = await Issue.create({
      title,
      description,
      category,
      severity,
      latitude: Number(latitude),
      longitude: Number(longitude),
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      reportedBy: req.user._id, // Got this from the 'protect' middleware
      status: 'Submitted',
      ...aiData
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

// @desc    Get issues for map display
// @route   GET /api/issues/map
// @access  Public
const getMapIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null }
    }).select('_id title category severity status latitude longitude imageUrl aiIssueType aiConfidence problemDetected');
      
    res.json(issues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching map issues' });
  }
};

// @desc    Test AI Analysis independently
// @route   POST /api/issues/test-ai
// @access  Public (for development/testing only)
const testAiAnalysis = async (req, res) => {
  try {
    const { imageUrl, category, description } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ message: 'imageUrl is required in the request body' });
    }
    
    const analysis = await analyzeIssueImage(imageUrl, category, description);
    
    if (analysis) {
      res.json({ success: true, analysis });
    } else {
      res.status(500).json({ success: false, message: 'AI Analysis failed or returned invalid data. Check server logs and verify GROQ_API_KEY.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during AI test' });
  }
};

// @desc    Confirm/Upvote an issue
// @route   PUT /api/issues/:id/confirm
// @access  Private
const confirmIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Check if the user is the reporter
    if (issue.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot confirm your own reported issue' });
    }

    // Ensure confirmations array exists
    if (!issue.confirmations) {
      issue.confirmations = [];
    }

    // Check if the user has already confirmed
    if (issue.confirmations.includes(req.user._id)) {
      return res.status(400).json({ message: 'You have already confirmed this issue' });
    }

    // Add user to confirmations array
    issue.confirmations.push(req.user._id);
    await issue.save();

    res.json({ message: 'Issue confirmed successfully', confirmations: issue.confirmations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while confirming issue' });
  }
};

module.exports = {
  createIssue,
  getMyIssues,
  getIssueById,
  getAllIssues,
  updateIssueStatus,
  getMapIssues,
  testAiAnalysis,
  confirmIssue,
};
