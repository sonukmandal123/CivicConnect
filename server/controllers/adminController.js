const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const { validateStatusTransition, recordStatusChange } = require('../services/statusTransitionService');
const { DEPARTMENTS, isValidDepartment } = require('../constants/departments');
const { calculatePriority } = require('../services/priorityService');
const { notifyCitizen } = require('../services/notificationService');
const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

/**
 * @desc    Update issue status with state machine validation (Admin only)
 * @route   PATCH /api/admin/issues/:id/status
 * @access  Private/Admin
 */
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

    // Validate the status transition using our state machine service
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

    // If an optional remark was provided, also add it to adminRemarks
    if (remark && remark.trim()) {
      issue.adminRemarks.push({
        text: remark.trim(),
        addedBy: req.user._id,
        createdAt: new Date()
      });
    }

    // Record in statusHistory and update current status
    recordStatusChange(issue, status, req.user._id, remark);

    const updatedIssue = await issue.save();
    await updatedIssue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'statusHistory.changedBy', select: 'name email role' },
      { path: 'adminRemarks.addedBy', select: 'name email role' }
    ]);

    // Notify citizen about status transition
    let notifTitle = `Status Update: ${status}`;
    let notifMsg = `Your report "${updatedIssue.title}" status is now ${status}.`;
    let notifType = 'STATUS_CHANGED';

    if (status === 'Under Review') {
      notifTitle = 'Report Under Review';
      notifMsg = `Municipal command center is reviewing your report "${updatedIssue.title}".${remark ? ` Note: "${remark}"` : ''}`;
    } else if (status === 'Verified') {
      notifTitle = 'Report Verified';
      notifMsg = `Your report "${updatedIssue.title}" has been verified by municipal inspectors as an authentic defect.${remark ? ` Note: "${remark}"` : ''}`;
    } else if (status === 'Rejected') {
      notifTitle = 'Report Update: Rejected';
      notifMsg = `Your report "${updatedIssue.title}" was not approved.${remark ? ` Reason: "${remark}"` : ''}`;
      notifType = 'ISSUE_REJECTED';
    }

    notifyCitizen({
      citizenId: updatedIssue.reportedBy?._id || updatedIssue.reportedBy,
      sender: req.user._id,
      issue: updatedIssue._id,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      link: `/issues/${updatedIssue._id}`
    }).catch(err => console.error('Failed to notify citizen on status update:', err.message));

    res.json({
      message: `Status successfully updated to ${status}`,
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error in admin updateIssueStatus:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
};

/**
 * @desc    Add an admin remark to an issue (Admin only)
 * @route   POST /api/admin/issues/:id/remarks
 * @access  Private/Admin
 */
const addAdminRemark = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Remark text is required' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const newRemark = {
      text: text.trim(),
      addedBy: req.user._id,
      createdAt: new Date()
    };

    issue.adminRemarks.push(newRemark);
    await issue.save();

    await issue.populate('adminRemarks.addedBy', 'name email role');

    // Notify citizen about administrative remark
    notifyCitizen({
      citizenId: issue.reportedBy,
      sender: req.user._id,
      issue: issue._id,
      type: 'ADMIN_REMARK',
      title: 'Municipal Update Added',
      message: `An administrator posted a note on your report "${issue.title}": "${text.trim()}"`,
      link: `/issues/${issue._id}`
    }).catch(err => console.error('Failed to notify citizen on remark:', err.message));

    res.status(201).json({
      message: 'Remark added successfully',
      adminRemarks: issue.adminRemarks
    });
  } catch (error) {
    console.error('Error adding admin remark:', error);
    res.status(500).json({ message: 'Server error while adding remark' });
  }
};

/**
 * @desc    Get status history and audit trail for an issue
 * @route   GET /api/admin/issues/:id/history
 * @access  Private/Admin
 */
const getIssueHistory = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .select('title status statusHistory adminRemarks verifiedAt verifiedBy rejectedAt rejectedBy')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('adminRemarks.addedBy', 'name email role')
      .populate('verifiedBy', 'name email')
      .populate('rejectedBy', 'name email');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json({
      issueId: issue._id,
      currentStatus: issue.status,
      statusHistory: issue.statusHistory,
      adminRemarks: issue.adminRemarks,
      verifiedAt: issue.verifiedAt,
      verifiedBy: issue.verifiedBy,
      rejectedAt: issue.rejectedAt,
      rejectedBy: issue.rejectedBy
    });
  } catch (error) {
    console.error('Error fetching issue history:', error);
    res.status(500).json({ message: 'Server error while fetching issue history' });
  }
};

/**
 * @desc    Get configured list of municipal departments
 * @route   GET /api/admin/departments
 * @access  Private/Admin
 */
const getDepartments = async (req, res) => {
  res.json({
    success: true,
    count: DEPARTMENTS.length,
    departments: DEPARTMENTS
  });
};

/**
 * @desc    Assign a verified issue to a municipal department (Admin only)
 * @route   PATCH /api/admin/issues/:id/assign
 * @access  Private/Admin
 */
const assignIssue = async (req, res) => {
  try {
    const { department, remark } = req.body;

    if (!department) {
      return res.status(400).json({ message: 'Department is required for assignment' });
    }

    if (!isValidDepartment(department)) {
      return res.status(400).json({ 
        message: `Invalid department '${department}'. Allowed departments: ${DEPARTMENTS.join(', ')}` 
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // SECTION 19 RULE: Issue must normally be Verified before being Assigned
    if (issue.status !== 'Verified') {
      return res.status(400).json({
        message: `Issue must be in 'Verified' status before assigning to a department. Current status: '${issue.status}'`,
        currentStatus: issue.status,
        requiredStatus: 'Verified'
      });
    }

    // Set assignment metadata
    issue.assignedDepartment = department;
    issue.assignedBy = req.user._id;
    issue.assignedAt = new Date();

    const assignmentRemark = remark && remark.trim() 
      ? `Assigned to ${department}: ${remark.trim()}`
      : `Assigned to ${department}`;

    // Add remark to adminRemarks if provided
    if (remark && remark.trim()) {
      issue.adminRemarks.push({
        text: assignmentRemark,
        addedBy: req.user._id,
        createdAt: new Date()
      });
    }

    // Update status to 'Assigned' and record in status history
    recordStatusChange(issue, 'Assigned', req.user._id, assignmentRemark);

    const updatedIssue = await issue.save();
    await updatedIssue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'statusHistory.changedBy', select: 'name email role' },
      { path: 'adminRemarks.addedBy', select: 'name email role' }
    ]);

    // Notify citizen about department assignment
    notifyCitizen({
      citizenId: updatedIssue.reportedBy?._id || updatedIssue.reportedBy,
      sender: req.user._id,
      issue: updatedIssue._id,
      type: 'ISSUE_ASSIGNED',
      title: `Assigned to ${department}`,
      message: `Your report "${updatedIssue.title}" has been assigned to the ${department} division for scheduling.${remark ? ` Dispatch note: "${remark}"` : ''}`,
      link: `/issues/${updatedIssue._id}`
    }).catch(err => console.error('Failed to notify citizen on assignment:', err.message));

    res.json({
      message: `Issue successfully assigned to ${department}`,
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({ message: 'Server error while assigning issue' });
  }
};

/**
 * @desc    Transition an assigned issue to In Progress (Admin only)
 * @route   PATCH /api/admin/issues/:id/in-progress
 * @access  Private/Admin
 */
const markInProgress = async (req, res) => {
  try {
    const { remark } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    if (issue.status !== 'Assigned') {
      return res.status(400).json({
        message: `Issue must be in 'Assigned' status before moving to In Progress. Current status: '${issue.status}'`,
        currentStatus: issue.status,
        requiredStatus: 'Assigned'
      });
    }

    const progressRemark = remark && remark.trim()
      ? `Work started: ${remark.trim()}`
      : 'Field work initiated by assigned department';

    if (remark && remark.trim()) {
      issue.adminRemarks.push({
        text: progressRemark,
        addedBy: req.user._id,
        createdAt: new Date()
      });
    }

    recordStatusChange(issue, 'In Progress', req.user._id, progressRemark);

    const updatedIssue = await issue.save();
    await updatedIssue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'statusHistory.changedBy', select: 'name email role' },
      { path: 'adminRemarks.addedBy', select: 'name email role' }
    ]);

    // Notify citizen about work in progress
    notifyCitizen({
      citizenId: updatedIssue.reportedBy?._id || updatedIssue.reportedBy,
      sender: req.user._id,
      issue: updatedIssue._id,
      type: 'ISSUE_IN_PROGRESS',
      title: 'Repairs In Progress',
      message: `Field crew has begun on-site repair work for your report "${updatedIssue.title}".${remark ? ` Status: "${remark}"` : ''}`,
      link: `/issues/${updatedIssue._id}`
    }).catch(err => console.error('Failed to notify citizen on in progress:', err.message));

    res.json({
      message: 'Issue marked as In Progress',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error marking issue in progress:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
};

/**
 * @desc    Resolve an issue with description and optional resolution image (Admin only)
 * @route   POST /api/admin/issues/:id/resolve
 * @access  Private/Admin
 */
const resolveIssue = async (req, res) => {
  try {
    const { resolutionDescription } = req.body;

    if (!resolutionDescription || !resolutionDescription.trim()) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: 'Resolution description is mandatory when resolving an issue' });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ message: 'Issue not found' });
    }

    // SECTION 66 RULE: Issue must be In Progress before resolving
    if (issue.status !== 'In Progress') {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: `Issue must be in 'In Progress' status before it can be marked as Resolved. Current status: '${issue.status}'`,
        currentStatus: issue.status,
        requiredStatus: 'In Progress'
      });
    }

    // Upload resolution image to Cloudinary folder civicconnect/resolutions if file provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: 'civicconnect/resolutions'
      });
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      issue.resolutionImageUrl = uploadResult.secure_url;
      issue.resolutionImagePublicId = uploadResult.public_id;
    }

    // Set resolution fields
    issue.resolutionDescription = resolutionDescription.trim();
    issue.resolvedAt = new Date();
    issue.resolvedBy = req.user._id;

    const resolutionRemark = `Resolution completed: ${resolutionDescription.trim()}`;

    // Add to adminRemarks
    issue.adminRemarks.push({
      text: resolutionRemark,
      addedBy: req.user._id,
      createdAt: new Date()
    });

    // Record in statusHistory and update status
    recordStatusChange(issue, 'Resolved', req.user._id, resolutionRemark);

    const updatedIssue = await issue.save();
    await updatedIssue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'assignedBy', select: 'name email role' },
      { path: 'resolvedBy', select: 'name email role' },
      { path: 'statusHistory.changedBy', select: 'name email role' },
      { path: 'adminRemarks.addedBy', select: 'name email role' }
    ]);

    // Notify citizen about final resolution
    notifyCitizen({
      citizenId: updatedIssue.reportedBy?._id || updatedIssue.reportedBy,
      sender: req.user._id,
      issue: updatedIssue._id,
      type: 'ISSUE_RESOLVED',
      title: 'Issue Resolved',
      message: `Your reported civic issue "${updatedIssue.title}" has been successfully resolved. Work performed: "${resolutionDescription.trim()}". Check the tracking page for photo proof.`,
      link: `/issues/${updatedIssue._id}`
    }).catch(err => console.error('Failed to notify citizen on resolution:', err.message));

    res.json({
      message: 'Issue successfully resolved',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error resolving issue:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Server error while resolving issue' });
  }
};

/**
 * @desc    Get all issues with search, filtering, sorting, and pagination (Admin only)
 * @route   GET /api/admin/issues
 * @access  Private/Admin
 */
const getAdminIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      status = 'All',
      category = 'All',
      severity = 'All',
      priority = 'All',
      department = 'All',
      sort = 'priority_desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    // Build Query
    const query = {};

    // 1. Text Search (title, description, category, or ObjectId)
    if (search && search.trim()) {
      const s = search.trim();
      if (mongoose.Types.ObjectId.isValid(s) && s.length === 24) {
        query._id = s;
      } else {
        query.$or = [
          { title: { $regex: s, $options: 'i' } },
          { description: { $regex: s, $options: 'i' } },
          { category: { $regex: s, $options: 'i' } }
        ];
      }
    }

    // 2. Filters
    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (severity && severity !== 'All') {
      query.severity = severity;
    }

    if (priority && priority !== 'All') {
      query.priorityLevel = priority;
    }

    if (department && department !== 'All') {
      query.assignedDepartment = department;
    }

    // 3. Sorting
    let sortOptions = { priorityScore: -1, createdAt: -1 };
    switch (sort) {
      case 'priority_desc':
        sortOptions = { priorityScore: -1, createdAt: -1 };
        break;
      case 'priority_asc':
        sortOptions = { priorityScore: 1, createdAt: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      case 'confidence':
        sortOptions = { aiConfidence: -1 };
        break;
      case 'longest_pending':
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { priorityScore: -1, createdAt: -1 };
    }

    // Execute queries in parallel: count matching, fetch issues, and aggregate KPI summary
    const [totalMatching, issues, statusCounts, priorityCounts] = await Promise.all([
      Issue.countDocuments(query),
      Issue.find(query)
        .populate('reportedBy', 'name email')
        .populate('assignedBy', 'name email role')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Issue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Issue.aggregate([
        { $group: { _id: '$priorityLevel', count: { $sum: 1 } } }
      ])
    ]);

    // Build KPI Summary metrics
    const summary = {
      total: 0,
      submitted: 0,
      underReview: 0,
      pending: 0, // submitted + underReview
      verified: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      criticalPriority: 0,
      highPriority: 0
    };

    statusCounts.forEach(sc => {
      summary.total += sc.count;
      if (sc._id === 'Submitted') summary.submitted = sc.count;
      else if (sc._id === 'Under Review') summary.underReview = sc.count;
      else if (sc._id === 'Verified') summary.verified = sc.count;
      else if (sc._id === 'Assigned') summary.assigned = sc.count;
      else if (sc._id === 'In Progress') summary.inProgress = sc.count;
      else if (sc._id === 'Resolved') summary.resolved = sc.count;
      else if (sc._id === 'Rejected') summary.rejected = sc.count;
    });
    summary.pending = summary.submitted + summary.underReview;

    priorityCounts.forEach(pc => {
      if (pc._id === 'Critical') summary.criticalPriority = pc.count;
      else if (pc._id === 'High') summary.highPriority = pc.count;
    });

    res.json({
      success: true,
      pagination: {
        total: totalMatching,
        page: pageNum,
        pages: Math.ceil(totalMatching / limitNum) || 1,
        limit: limitNum
      },
      summary,
      issues
    });
  } catch (error) {
    console.error('Error in getAdminIssues:', error);
    res.status(500).json({ message: 'Server error while fetching admin issues' });
  }
};

/**
 * @desc    Get single issue with populated references, live priority breakdown, and history
 * @route   GET /api/admin/issues/:id
 * @access  Private/Admin
 */
const getSingleAdminIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('assignedBy', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('duplicateOf', 'title category status')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('adminRemarks.addedBy', 'name email role');

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    const priorityBreakdown = calculatePriority(issue);
    const issueObj = issue.toObject();
    issueObj.priority = priorityBreakdown;

    res.json({
      success: true,
      issue: issueObj
    });
  } catch (error) {
    console.error('Error fetching admin issue:', error);
    res.status(500).json({ message: 'Server error while fetching issue' });
  }
};

/**
 * @desc    Mark an issue as duplicate of another report (Admin only)
 * @route   POST /api/admin/issues/:id/duplicate
 * @access  Private/Admin
 */
const markDuplicateIssue = async (req, res) => {
  try {
    const { duplicateOf, remark } = req.body;

    if (!duplicateOf) {
      return res.status(400).json({ message: 'Target issue ID (duplicateOf) is required' });
    }

    if (duplicateOf === req.params.id) {
      return res.status(400).json({ message: 'An issue cannot be marked as a duplicate of itself' });
    }

    const [issue, targetIssue] = await Promise.all([
      Issue.findById(req.params.id),
      Issue.findById(duplicateOf)
    ]);

    if (!issue) {
      return res.status(404).json({ message: 'Current issue not found' });
    }

    if (!targetIssue) {
      return res.status(404).json({ message: 'Original issue (duplicateOf) not found' });
    }

    issue.duplicateOf = targetIssue._id;

    const dupRemark = remark && remark.trim()
      ? `Marked as duplicate of report #${targetIssue._id} (${targetIssue.title}): ${remark.trim()}`
      : `Marked as duplicate of report #${targetIssue._id} (${targetIssue.title})`;

    issue.adminRemarks.push({
      text: dupRemark,
      addedBy: req.user._id,
      createdAt: new Date()
    });

    if (issue.status !== 'Rejected' && issue.status !== 'Resolved') {
      recordStatusChange(issue, 'Rejected', req.user._id, dupRemark);
      issue.rejectedAt = new Date();
      issue.rejectedBy = req.user._id;
    }

    const updatedIssue = await issue.save();
    await updatedIssue.populate([
      { path: 'reportedBy', select: 'name email' },
      { path: 'duplicateOf', select: 'title category status' },
      { path: 'statusHistory.changedBy', select: 'name email role' },
      { path: 'adminRemarks.addedBy', select: 'name email role' }
    ]);

    // Notify citizen that issue was linked as duplicate
    notifyCitizen({
      citizenId: updatedIssue.reportedBy?._id || updatedIssue.reportedBy,
      sender: req.user._id,
      issue: updatedIssue._id,
      type: 'ISSUE_REJECTED',
      title: 'Report Linked as Duplicate',
      message: `Your report "${updatedIssue.title}" was identified as duplicate of report #${targetIssue._id} ("${targetIssue.title}"). Tracking will continue under the primary report.`,
      link: `/issues/${updatedIssue._id}`
    }).catch(err => console.error('Failed to notify citizen on duplicate:', err.message));

    res.json({
      message: 'Issue successfully marked as duplicate',
      issue: updatedIssue
    });
  } catch (error) {
    console.error('Error marking duplicate issue:', error);
    res.status(500).json({ message: 'Server error while marking duplicate' });
  }
};

module.exports = {
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
};



