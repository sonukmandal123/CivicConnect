/**
 * priorityService.js
 * 
 * Implements the rule-based "CivicConnect Priority Score" algorithm.
 * 
 * Formula:
 * Priority Score (0-100) = Severity Points (0-30)
 *                        + Community Confirmations Points (0-25)
 *                        + AI Support Points (0-20)
 *                        + Time Pending Points (0-25)
 * 
 * Priority Levels:
 *  0 - 24  => Low
 * 25 - 49  => Medium
 * 50 - 74  => High
 * 75 - 100 => Critical
 */

const SEVERITY_POINTS = {
  'Low': 10,
  'Medium': 20,
  'High': 30
};

const MAX_POINTS = {
  severity: 30,
  confirmations: 25,
  aiSupport: 20,
  timePending: 25
};

/**
 * Calculates rule-based priority score, level, and transparent factor breakdown.
 * @param {Object} issue - The issue object/document
 * @returns {Object} { score, level, factors, explanation }
 */
const calculatePriority = (issue) => {
  if (!issue) {
    return {
      score: 0,
      level: 'Low',
      factors: {},
      explanation: 'No issue data provided'
    };
  }

  // 1. Severity Contribution (Max 30)
  const severity = issue.severity || 'Low';
  const severityScore = SEVERITY_POINTS[severity] || 10;

  // 2. Community Confirmations Contribution (Max 25)
  // Each confirmation adds 5 points, capped at 25 points (5+ confirmations = max points)
  const confirmationsCount = Array.isArray(issue.confirmations) ? issue.confirmations.length : 0;
  const confirmationScore = Math.min(confirmationsCount * 5, MAX_POINTS.confirmations);

  // 3. AI Support Contribution (Max 20)
  // AI is assistive: confidence adds proportional points, matching category adds a bonus
  let aiScore = 0;
  let aiDetails = { problemDetected: false, confidence: 0, categoryMatch: false };

  if (issue.problemDetected === true) {
    const confidence = typeof issue.aiConfidence === 'number' ? issue.aiConfidence : 0;
    // Scale confidence (0-100) to 0-15 points
    const baseAiPoints = Math.round((confidence / 100) * 15);

    // +5 bonus if AI identified category matches user reported category
    const categoryMatches = issue.aiIssueType && issue.category && 
      issue.aiIssueType.toLowerCase() === issue.category.toLowerCase();
    const categoryBonus = categoryMatches ? 5 : 0;

    aiScore = Math.min(baseAiPoints + categoryBonus, MAX_POINTS.aiSupport);
    aiDetails = {
      problemDetected: true,
      confidence,
      categoryMatch: categoryMatches
    };
  }

  // 4. Time Pending Contribution (Max 25)
  // Older unresolved reports gradually receive additional points so they don't get neglected
  let timeScore = 0;
  let daysPending = 0;

  if (issue.status !== 'Resolved' && issue.status !== 'Rejected') {
    const createdAt = issue.createdAt ? new Date(issue.createdAt) : new Date();
    const now = new Date();
    const diffMs = Math.max(0, now - createdAt);
    daysPending = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // +2 points per full day pending, capped at 25 points (~12.5 days)
    timeScore = Math.min(daysPending * 2, MAX_POINTS.timePending);
  }

  // Calculate raw total and cap strictly between 0 and 100
  const totalScore = Math.min(100, Math.max(0, severityScore + confirmationScore + aiScore + timeScore));

  // Determine Level
  let level = 'Low';
  if (totalScore >= 75) {
    level = 'Critical';
  } else if (totalScore >= 50) {
    level = 'High';
  } else if (totalScore >= 25) {
    level = 'Medium';
  }

  // Build human-readable explanation strings for viva/professors
  const explanationParts = [
    `${severity} severity: +${severityScore}`
  ];

  if (confirmationsCount > 0) {
    explanationParts.push(`${confirmationsCount} confirmation${confirmationsCount > 1 ? 's' : ''}: +${confirmationScore}`);
  }

  if (aiScore > 0) {
    explanationParts.push(`AI support (${aiDetails.confidence}% conf${aiDetails.categoryMatch ? ', category verified' : ''}): +${aiScore}`);
  }

  if (timeScore > 0) {
    explanationParts.push(`Pending for ${daysPending} day${daysPending !== 1 ? 's' : ''}: +${timeScore}`);
  }

  return {
    score: totalScore,
    level,
    factors: {
      severity: {
        value: severity,
        points: severityScore,
        max: MAX_POINTS.severity
      },
      confirmations: {
        count: confirmationsCount,
        points: confirmationScore,
        max: MAX_POINTS.confirmations
      },
      aiSupport: {
        problemDetected: aiDetails.problemDetected,
        confidence: aiDetails.confidence,
        categoryMatch: aiDetails.categoryMatch,
        points: aiScore,
        max: MAX_POINTS.aiSupport
      },
      timePending: {
        days: daysPending,
        points: timeScore,
        max: MAX_POINTS.timePending
      }
    },
    summary: explanationParts.join(' | ')
  };
};

module.exports = {
  calculatePriority,
  SEVERITY_POINTS,
  MAX_POINTS
};
