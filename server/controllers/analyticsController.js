const Issue = require('../models/Issue');

/**
 * analyticsController.js
 * 
 * Provides administrative analytics and statistical aggregation using MongoDB pipelines.
 * All calculations are executed directly within the database engine for maximum performance.
 */

/**
 * @desc    Get complete analytics dashboard dataset in a single call
 * @route   GET /api/admin/analytics
 * @access  Private/Admin
 */
const getFullAnalytics = async (req, res) => {
  try {
    const [
      summaryData,
      categoryStats,
      statusStats,
      severityStats,
      priorityStats,
      timelineStats,
      resolutionStats,
      communityStats,
      aiStats
    ] = await Promise.all([
      getSummaryAggregation(),
      getCategoryAggregation(),
      getStatusAggregation(),
      getSeverityAggregation(),
      getPriorityAggregation(),
      getTimelineAggregation(),
      getResolutionAggregation(),
      getCommunityAggregation(),
      getAiAggregation()
    ]);

    res.json({
      success: true,
      timestamp: new Date(),
      data: {
        summary: summaryData,
        categories: categoryStats,
        statuses: statusStats,
        severities: severityStats,
        priorities: priorityStats,
        timeline: timelineStats,
        resolution: resolutionStats,
        community: communityStats,
        ai: aiStats
      }
    });
  } catch (error) {
    console.error('Error compiling analytics:', error);
    res.status(500).json({ message: 'Server error while calculating analytics' });
  }
};

// 1. Summary KPIs
const getSummaryAggregation = async () => {
  const [statusCounts, priorityCounts, totalCount] = await Promise.all([
    Issue.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Issue.aggregate([{ $group: { _id: '$priorityLevel', count: { $sum: 1 } } }]),
    Issue.countDocuments()
  ]);

  const summary = {
    totalIssues: totalCount,
    submitted: 0,
    underReview: 0,
    pendingReview: 0,
    verified: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    criticalPriority: 0,
    highPriority: 0
  };

  statusCounts.forEach(s => {
    if (s._id === 'Submitted') summary.submitted = s.count;
    else if (s._id === 'Under Review') summary.underReview = s.count;
    else if (s._id === 'Verified') summary.verified = s.count;
    else if (s._id === 'Assigned') summary.assigned = s.count;
    else if (s._id === 'In Progress') summary.inProgress = s.count;
    else if (s._id === 'Resolved') summary.resolved = s.count;
    else if (s._id === 'Rejected') summary.rejected = s.count;
  });
  summary.pendingReview = summary.submitted + summary.underReview;

  priorityCounts.forEach(p => {
    if (p._id === 'Critical') summary.criticalPriority = p.count;
    else if (p._id === 'High') summary.highPriority = p.count;
  });

  return summary;
};

// 2. Category Distribution
const getCategoryAggregation = async () => {
  return await Issue.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $project: { category: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);
};

// 3. Status Distribution
const getStatusAggregation = async () => {
  return await Issue.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $project: { status: '$_id', count: 1, _id: 0 } }
  ]);
};

// 4. Severity Distribution
const getSeverityAggregation = async () => {
  return await Issue.aggregate([
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $project: { severity: '$_id', count: 1, _id: 0 } },
    { $sort: { count: -1 } }
  ]);
};

// 5. Priority Distribution
const getPriorityAggregation = async () => {
  return await Issue.aggregate([
    { $group: { _id: '$priorityLevel', count: { $sum: 1 } } },
    { $project: { priorityLevel: '$_id', count: 1, _id: 0 } }
  ]);
};

// 6. Timeline Distribution (Last 30 days of reported issues)
const getTimelineAggregation = async () => {
  return await Issue.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }
    },
    { $project: { date: '$_id', count: 1, _id: 0 } },
    { $sort: { date: 1 } }
  ]);
};

// 7. Resolution Metrics
const getResolutionAggregation = async () => {
  const resolutionPipeline = await Issue.aggregate([
    {
      $match: {
        status: 'Resolved'
      }
    },
    {
      $project: {
        durationHours: {
          $divide: [
            { $subtract: [{ $ifNull: ['$resolvedAt', '$updatedAt'] }, '$createdAt'] },
            1000 * 60 * 60 // Convert ms to hours
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        totalResolved: { $sum: 1 },
        avgHours: { $avg: '$durationHours' },
        minHours: { $min: '$durationHours' },
        maxHours: { $max: '$durationHours' }
      }
    }
  ]);

  if (!resolutionPipeline || resolutionPipeline.length === 0) {
    return {
      totalResolved: 0,
      avgResolutionHours: 0,
      avgResolutionDays: 0,
      fastestHours: 0,
      longestHours: 0,
      message: 'No resolution data available yet.'
    };
  }

  const stat = resolutionPipeline[0];
  const avgHours = Math.round((stat.avgHours || 0) * 10) / 10;
  const avgDays = Math.round((avgHours / 24) * 10) / 10;

  return {
    totalResolved: stat.totalResolved,
    avgResolutionHours: avgHours,
    avgResolutionDays: avgDays,
    fastestHours: Math.round((stat.minHours || 0) * 10) / 10,
    longestHours: Math.round((stat.maxHours || 0) * 10) / 10
  };
};

// 8. Community Confirmation Metrics
const getCommunityAggregation = async () => {
  const [totals, topIssues] = await Promise.all([
    Issue.aggregate([
      {
        $project: {
          confirmationCount: {
            $cond: {
              if: { $isArray: '$confirmations' },
              then: { $size: '$confirmations' },
              else: 0
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalConfirmations: { $sum: '$confirmationCount' },
          avgConfirmations: { $avg: '$confirmationCount' }
        }
      }
    ]),
    Issue.aggregate([
      {
        $project: {
          title: 1,
          category: 1,
          status: 1,
          priorityLevel: 1,
          confirmationsCount: {
            $cond: {
              if: { $isArray: '$confirmations' },
              then: { $size: '$confirmations' },
              else: 0
            }
          }
        }
      },
      { $sort: { confirmationsCount: -1 } },
      { $limit: 5 }
    ])
  ]);

  const total = totals.length > 0 ? totals[0].totalConfirmations : 0;
  const avg = totals.length > 0 ? Math.round((totals[0].avgConfirmations || 0) * 10) / 10 : 0;

  return {
    totalConfirmations: total,
    avgConfirmationsPerIssue: avg,
    topConfirmedIssues: topIssues
  };
};

// 9. AI Assistive Vision Metrics
const getAiAggregation = async () => {
  const [generalStats, aiCategories] = await Promise.all([
    Issue.aggregate([
      {
        $group: {
          _id: null,
          totalInspected: {
            $sum: {
              $cond: [{ $ifNull: ['$aiConfidence', false] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$aiConfidence' },
          problemsDetected: {
            $sum: {
              $cond: [{ $eq: ['$problemDetected', true] }, 1, 0]
            }
          }
        }
      }
    ]),
    Issue.aggregate([
      {
        $match: {
          aiIssueType: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$aiIssueType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  if (!generalStats || generalStats.length === 0) {
    return {
      totalWithAI: 0,
      avgConfidence: 0,
      problemDetectionRate: 0,
      aiDetectedCategories: []
    };
  }

  const stat = generalStats[0];
  const total = stat.totalInspected || 0;
  const avgConf = Math.round((stat.avgConfidence || 0) * 10) / 10;
  const detectionRate = total > 0 ? Math.round(((stat.problemsDetected || 0) / total) * 100) : 0;

  return {
    totalWithAI: total,
    avgConfidence: avgConf,
    problemDetectionRate: `${detectionRate}%`,
    aiDetectedCategories: aiCategories.map(c => ({ category: c._id, count: c.count }))
  };
};

// Granular sub-endpoint handlers for specific analytics tabs/APIs
const getAnalyticsSummary = async (req, res) => {
  try {
    const summary = await getSummaryAggregation();
    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving summary analytics' });
  }
};

const getCategoryAnalytics = async (req, res) => {
  try {
    const categories = await getCategoryAggregation();
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving category analytics' });
  }
};

const getStatusAnalytics = async (req, res) => {
  try {
    const statuses = await getStatusAggregation();
    res.json({ success: true, statuses });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving status analytics' });
  }
};

const getSeverityAnalytics = async (req, res) => {
  try {
    const severities = await getSeverityAggregation();
    res.json({ success: true, severities });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving severity analytics' });
  }
};

const getPriorityAnalytics = async (req, res) => {
  try {
    const priorities = await getPriorityAggregation();
    res.json({ success: true, priorities });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving priority analytics' });
  }
};

const getTimelineAnalytics = async (req, res) => {
  try {
    const timeline = await getTimelineAggregation();
    res.json({ success: true, timeline });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving timeline analytics' });
  }
};

const getResolutionAnalytics = async (req, res) => {
  try {
    const resolution = await getResolutionAggregation();
    res.json({ success: true, resolution });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving resolution analytics' });
  }
};

const getCommunityAnalytics = async (req, res) => {
  try {
    const community = await getCommunityAggregation();
    res.json({ success: true, community });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving community analytics' });
  }
};

const getAiAnalytics = async (req, res) => {
  try {
    const ai = await getAiAggregation();
    res.json({ success: true, ai });
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving AI analytics' });
  }
};

module.exports = {
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
};
