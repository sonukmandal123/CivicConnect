/**
 * departments.js
 * 
 * Configurable list of municipal departments responsible for civic issues.
 * Keeping this centralized avoids hardcoding department names across the project.
 */

const DEPARTMENTS = [
  'Road Maintenance',
  'Electrical',
  'Sanitation',
  'Drainage',
  'Water',
  'Public Facilities',
  'Other'
];

/**
 * Validates if the given department name is within the supported list.
 * @param {string} department
 * @returns {boolean}
 */
const isValidDepartment = (department) => {
  return typeof department === 'string' && DEPARTMENTS.includes(department.trim());
};

module.exports = {
  DEPARTMENTS,
  isValidDepartment
};
