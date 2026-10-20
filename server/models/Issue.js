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
    enum: [
      'Submitted',
      'Under Review',
      'Verified',
      'Assigned',
      'In Progress',
      'Resolved',
      'Rejected'
    ],
    default: 'Submitted',
  },
  
  // Phase 3 Status Audit History
  statusHistory: [{
    status: {
      type: String,
      enum: [
        'Submitted',
        'Under Review',
        'Verified',
        'Assigned',
        'In Progress',
        'Resolved',
        'Rejected'
      ],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    remark: String,
  }],

  // Phase 3 Admin Remarks
  adminRemarks: [{
    text: {
      type: String,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],

  // Phase 3 Verification & Rejection Audit
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // Phase 3 Department Assignment
  assignedDepartment: String,
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedAt: Date,

  // Phase 3 Resolution Tracking
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolutionDescription: String,
  resolutionImageUrl: String,
  resolutionImagePublicId: String,

  // Phase 3 Priority System
  priorityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  priorityLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low',
  },
  priorityExplanation: {
    type: Object,
  },

  // Phase 3 Duplicate Handling
  duplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
  },

  // Phase 2 Geospatial fields (kept for 100% backward compatibility):
  latitude: {
    type: Number,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180,
  },
  locationAddress: String,

  // Phase 3 GeoJSON Point for geospatial queries (coordinates: [longitude, latitude])
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    },
  },
  
  // Phase 2 AI additions:
  aiConfidence: Number,
  aiIssueType: String,
  problemDetected: Boolean,
  aiExplanation: String,
  
  // Community Confirmations
  confirmations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

// Create 2dsphere index on location for geospatial queries (sparse ignores documents without valid location)
issueSchema.index({ location: '2dsphere' }, { sparse: true });
// Index status, category, and priorityScore for high performance queries
issueSchema.index({ status: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ priorityScore: -1 });

module.exports = mongoose.model('Issue', issueSchema);
