/**
 * statusTransitionService.js
 * 
 * Manages the allowed lifecycle transitions for civic issues in CivicConnect.
 * This acts as a "State Machine" to ensure issues move systematically:
 * 
 * Submitted -> Under Review -> Verified -> Assigned -> In Progress -> Resolved
 *                         \-> Rejected
 */

// Define allowed transitions: currentStatus -> array of allowed next statuses
const ALLOWED_TRANSITIONS = {
  'Submitted': ['Under Review'],
  'Under Review': ['Verified', 'Rejected'],
  'Verified': ['Assigned', 'Under Review'], // Can be assigned or put back for re-review if needed
  'Assigned': ['In Progress', 'Verified'],  // In progress or un-assigned back to verified
  'In Progress': ['Resolved', 'Assigned'],  // Resolved or sent back to assigned
  'Resolved': [],                           // Terminal state: Cannot transition once resolved
  'Rejected': ['Under Review']              // Allows appealing/re-evaluating a rejected issue
};

/**
 * Validates whether moving from currentStatus to newStatus is allowed.
 * @param {string} currentStatus - Current status of the issue
 * @param {string} newStatus - Requested target status
 * @returns {{ isValid: boolean, message: string }} Validation result
 */
const validateStatusTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) {
    return {
      isValid: false,
      message: 'Both current status and new status must be provided.'
    };
  }

  if (currentStatus === newStatus) {
    return {
      isValid: false,
      message: `Issue is already in status '${currentStatus}'.`
    };
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus];

  if (!allowedNextStatuses) {
    return {
      isValid: false,
      message: `Unknown or unhandled current status: '${currentStatus}'.`
    };
  }

  if (!allowedNextStatuses.includes(newStatus)) {
    const allowedList = allowedNextStatuses.length > 0 
      ? allowedNextStatuses.map(s => `'${s}'`).join(' or ') 
      : 'None (this is a final status)';
    return {
      isValid: false,
      message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed next status: ${allowedList}.`
    };
  }

  return {
    isValid: true,
    message: 'Transition is valid.'
  };
};

/**
 * Helper to append an entry to an issue's statusHistory array.
 * Ensures the status history is always consistent with status updates.
 * @param {Object} issue - Mongoose issue document
 * @param {string} newStatus - The new status
 * @param {string|ObjectId} changedBy - ID of the user/admin making the change
 * @param {string} remark - Optional explanation/note for the transition
 */
const recordStatusChange = (issue, newStatus, changedBy, remark = '') => {
  if (!issue.statusHistory) {
    issue.statusHistory = [];
  }

  issue.statusHistory.push({
    status: newStatus,
    changedBy: changedBy,
    changedAt: new Date(),
    remark: remark || `Status changed from ${issue.status} to ${newStatus}`
  });

  issue.status = newStatus;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  validateStatusTransition,
  recordStatusChange
};
