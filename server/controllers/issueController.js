const Issue = require('../models/Issue');
const { cloudinary } = require('../config/cloudinary');
const { analyzeIssueImage } = require('../services/aiService');
const { validateStatusTransition, recordStatusChange } = require('../services/statusTransitionService');
const { calculatePriority } = require('../services/priorityService');
const { notifyAllAdmins, notifyCitizen } = require('../services/notificationService');
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

    // Calculate initial priority score and level
    const initialPriority = calculatePriority({
      severity,
      confirmations: [],
      ...aiData,
      category,
      createdAt: new Date(),
      status: 'Submitted'
    });

    // Create the issue in MongoDB
    const issue = await Issue.create({
      title,
      description,
      category,
      severity,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location: {
        type: 'Point',
        coordinates: [Number(longitude), Number(latitude)]
      },
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
      reportedBy: req.user._id, // Got this from the 'protect' middleware
      status: 'Submitted',
      priorityScore: initialPriority.score,
      priorityLevel: initialPriority.level,
      priorityExplanation: initialPriority.factors,
      statusHistory: [{
        status: 'Submitted',
        changedBy: req.user._id,
        changedAt: new Date(),
        remark: 'Issue submitted by citizen'
      }],
      ...aiData
    });

    // Notify all municipal admins about the newly submitted civic issue
    notifyAllAdmins({
      sender: req.user._id,
      issue: issue._id,
      type: 'ISSUE_SUBMITTED',
      title: 'New Civic Issue Reported',
      message: `${req.user.name || 'A citizen'} reported a new ${issue.severity} severity ${issue.category}: "${issue.title}".`,
      link: `/admin/issues/${issue._id}`
    }).catch(err => console.error('Failed to notify admins on new issue:', err.message));

    // Acknowledge report receipt to the reporting citizen
    notifyCitizen({
      citizenId: req.user._id,
      issue: issue._id,
      type: 'ISSUE_SUBMITTED',
      title: 'Report Submitted Successfully',
      message: `Your report "${issue.title}" has been registered in the municipal queue with initial priority ${issue.priorityLevel} (${issue.priorityScore} pts).`,
      link: `/issues/${issue._id}`
    }).catch(err => console.error('Failed to notify citizen on issue submission:', err.message));

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
// @access  Public
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name')
      .populate('assignedBy', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('adminRemarks.addedBy', 'name email role');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Attach dynamic live priority calculation with human-readable factors
    const livePriority = calculatePriority(issue);
    const issueObj = issue.toObject();
    issueObj.priority = livePriority;

    res.json(issueObj);
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
    const { status, remark } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Target status is required' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Validate the status transition using state machine service
    const transitionCheck = validateStatusTransition(issue.status, status);
    if (!transitionCheck.isValid) {
      return res.status(400).json({ 
        message: transitionCheck.message,
        currentStatus: issue.status,
        requestedStatus: status
      });
    }

    // Set audit fields for Verification or Rejection
    if (status === 'Verified') {
      issue.verifiedAt = new Date();
      issue.verifiedBy = req.user._id;
    } else if (status === 'Rejected') {
      issue.rejectedAt = new Date();
      issue.rejectedBy = req.user._id;
    }

    if (remark && remark.trim()) {
      issue.adminRemarks.push({
        text: remark.trim(),
        addedBy: req.user._id,
        createdAt: new Date()
      });
    }

    // Record in statusHistory and update status
    recordStatusChange(issue, status, req.user._id, remark);

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

    // Recalculate priority score with updated community confirmations
    const updatedPriority = calculatePriority(issue);
    issue.priorityScore = updatedPriority.score;
    issue.priorityLevel = updatedPriority.level;
    issue.priorityExplanation = updatedPriority.factors;

    await issue.save();

    // Notify original reporting citizen of community upvote
    notifyCitizen({
      citizenId: issue.reportedBy,
      sender: req.user._id,
      issue: issue._id,
      type: 'ISSUE_CONFIRMED',
      title: 'Community Support: +5 Priority Points',
      message: `A community member confirmed your report "${issue.title}". Priority score increased to ${updatedPriority.score} (${updatedPriority.level}).`,
      link: `/issues/${issue._id}`
    }).catch(err => console.error('Failed to notify citizen on confirmation:', err.message));

    // If score crossed into Critical priority, alert all admins immediately
    if (updatedPriority.level === 'Critical') {
      notifyAllAdmins({
        sender: req.user._id,
        issue: issue._id,
        type: 'ISSUE_CONFIRMED',
        title: 'Urgent: Priority Escalated to Critical',
        message: `Civic report "${issue.title}" escalated to Critical priority (${updatedPriority.score}/100) after community confirmations.`,
        link: `/admin/issues/${issue._id}`
      }).catch(err => console.error('Failed to notify admins on critical escalation:', err.message));
    }

    res.json({
      message: 'Issue confirmed successfully',
      confirmations: issue.confirmations,
      priority: updatedPriority
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while confirming issue' });
  }
};

// @desc    Get priority score and detailed explanation breakdown for an issue
// @route   GET /api/issues/:id/priority
// @access  Public
const getIssuePriority = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const priorityData = calculatePriority(issue);
    res.json(priorityData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while calculating priority' });
  }
};

// @desc    Get nearby civic issues within a radius using MongoDB 2dsphere geospatial index
// @route   GET /api/issues/nearby
// @access  Public
const getNearbyIssues = async (req, res) => {
  try {
    const { longitude, latitude, radius, category, status, limit } = req.query;

    // 1. Validate coordinates presence
    if (longitude === undefined || latitude === undefined || longitude === '' || latitude === '') {
      return res.status(400).json({
        success: false,
        message: "Missing required geospatial coordinates: 'longitude' and 'latitude' parameters are required."
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // 2. Validate coordinates range
    if (isNaN(lng) || isNaN(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates: 'longitude' must be between -180 and 180, and 'latitude' must be between -90 and 90."
      });
    }

    // 3. Radius in meters (default: 5000m / 5km, clamped between 50m and 50000m)
    const radiusMeters = Math.min(Math.max(parseInt(radius) || 5000, 50), 50000);
    const maxResults = Math.min(parseInt(limit) || 50, 100);

    // 4. Construct optional filters
    const queryFilter = {};

    if (category && category !== 'All') {
      queryFilter.category = category;
    }

    if (status && status !== 'All') {
      queryFilter.status = status;
    } else {
      queryFilter.status = { $ne: 'Rejected' }; // Exclude rejected issues by default for public search
    }

    // 5. Execute geospatial aggregation with $geoNear
    const issues = await Issue.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          distanceField: 'distanceMeters',
          maxDistance: radiusMeters,
          spherical: true,
          query: queryFilter
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          severity: 1,
          status: 1,
          imageUrl: 1,
          latitude: 1,
          longitude: 1,
          location: 1,
          locationAddress: 1,
          priorityScore: 1,
          priorityLevel: 1,
          assignedDepartment: 1,
          confirmationsCount: {
            $cond: {
              if: { $isArray: '$confirmations' },
              then: { $size: '$confirmations' },
              else: 0
            }
          },
          createdAt: 1,
          distanceMeters: { $round: ['$distanceMeters', 1] },
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 2] }
        }
      },
      { $limit: maxResults }
    ]);

    res.json({
      success: true,
      center: { longitude: lng, latitude: lat },
      radiusMeters,
      radiusKm: Math.round((radiusMeters / 1000) * 10) / 10,
      count: issues.length,
      issues
    });
  } catch (error) {
    console.error('Error in getNearbyIssues:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while performing geospatial search',
      error: error.message
    });
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
  getIssuePriority,
  getNearbyIssues
};

