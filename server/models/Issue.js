const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Pothole',
      'Damaged Road',
      'Streetlight',
      'Garbage',
      'Blocked Drain',
      'Water Leakage',
      'Damaged Facility',
      'Other'
    ],
  },
  severity: {
    type: String,
    required: [true, 'Please select a severity level'],
    enum: ['Low', 'Medium', 'High'],
  },
  imageUrl: {
    type: String,
    // Will be populated after Cloudinary upload
  },
  imagePublicId: {
    type: String,
    // Will be populated after Cloudinary upload
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Verified', 'Rejected', 'Resolved'],
    default: 'Submitted',
  },
  
  // Phase 2 Geospatial additions:
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
  locationAddress: String,
  
  // Phase 2 AI additions:
  aiConfidence: Number,
  aiIssueType: String,
  problemDetected: Boolean,
  aiExplanation: String,
  
  // Community Confirmations
  confirmations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // priorityScore: Number,
  // priorityScore: Number,
  // adminRemarks: String,
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

module.exports = mongoose.model('Issue', issueSchema);
