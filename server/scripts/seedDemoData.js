/**
 * seedDemoData.js
 * 
 * Generates realistic municipal demonstration civic issues for CivicConnect Phase 3.
 * Safe & Idempotent: Does not remove existing accounts or real issues.
 * Calculates rule-based priorities, sets realistic timestamps, coordinates, and status histories.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { calculatePriority } = require('../services/priorityService');

const DEMO_ISSUES = [
  {
    title: 'Severe Deep Pothole on Main Road Bistupur',
    description: 'A 2-foot wide hazardous crater has developed in the right lane near the traffic junction. Causes sudden braking and poses accident risk for two-wheelers.',
    category: 'Pothole',
    severity: 'High',
    status: 'Verified',
    assignedDepartment: 'Road Maintenance',
    coordinates: [86.1955, 22.8015],
    locationAddress: 'Main Road Bistupur, near Bank of India Junction',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    daysAgo: 4,
    confirmationsCount: 3,
    aiIssueType: 'Pothole',
    aiConfidence: 96,
    problemDetected: true,
    aiExplanation: 'Groq vision model identified deep road asphalt cavity with high structural hazard.'
  },
  {
    title: 'Burst Drinking Water Pipeline near Sakchi Roundabout',
    description: 'Treated municipal water is gushing out across the road from an underground supply joint. Potable water is being wasted and street is flooded.',
    category: 'Water Leakage',
    severity: 'High',
    status: 'In Progress',
    assignedDepartment: 'Water',
    coordinates: [86.2023, 22.8124],
    locationAddress: 'Sakchi Roundabout, East Avenue Crossing',
    imageUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    daysAgo: 2,
    confirmationsCount: 4,
    aiIssueType: 'Water Leakage',
    aiConfidence: 92,
    problemDetected: true,
    aiExplanation: 'High-pressure water leakage detected with extensive road surface pooling.'
  },
  {
    title: 'Monsoon Stormwater Drain Overflow in Kadma Market',
    description: 'Silt and commercial solid waste have completely choked the open concrete drainage culvert. Wastewater is backing up onto pedestrian walkways.',
    category: 'Blocked Drain',
    severity: 'High',
    status: 'Assigned',
    assignedDepartment: 'Drainage',
    coordinates: [86.1750, 22.7932],
    locationAddress: 'Kadma Market, Lane 4, opposite Fish Market',
    imageUrl: 'https://images.unsplash.com/photo-1471922694854-ff1b63b20054?auto=format&fit=crop&w=800&q=80',
    daysAgo: 3,
    confirmationsCount: 2,
    aiIssueType: 'Blocked Drain',
    aiConfidence: 94,
    problemDetected: true,
    aiExplanation: 'Drain channel obstruction and stagnant sewage overflow detected.'
  },
  {
    title: 'Flickering High-Mast Street Light near Jubilee Park Gate',
    description: 'The overhead lighting column intermittently flashes and shuts off completely after 9 PM, making the pedestrian crossing dangerously dark.',
    category: 'Streetlight',
    severity: 'Medium',
    status: 'Resolved',
    assignedDepartment: 'Electrical',
    coordinates: [86.1989, 22.8090],
    locationAddress: 'Jubilee Park Main Gate, Park Road',
    imageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    daysAgo: 6,
    resolvedDaysAgo: 5,
    resolutionDescription: 'Electrical maintenance crew replaced the faulty 150W LED driver unit and re-crimped loose terminal blocks. Luminance verified.',
    resolutionImageUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
    confirmationsCount: 1,
    aiIssueType: 'Streetlight',
    aiConfidence: 89,
    problemDetected: true,
    aiExplanation: 'Street pole luminaire operational irregularity detected.'
  },
  {
    title: 'Illegal Solid Waste & Garbage Dumping along Marine Drive',
    description: 'Continuous unauthorized disposal of commercial plastic and building rubble creating open dump on embankment.',
    category: 'Garbage',
    severity: 'Medium',
    status: 'Under Review',
    assignedDepartment: 'Sanitation',
    coordinates: [86.1685, 22.8150],
    locationAddress: 'Marine Drive Road, Sector 3 Riverbank',
    imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80',
    daysAgo: 1,
    confirmationsCount: 5,
    aiIssueType: 'Garbage',
    aiConfidence: 97,
    problemDetected: true,
    aiExplanation: 'Extensive piles of municipal solid waste and plastic debris identified.'
  },
  {
    title: 'Sunken Asphalt & Structural Cracks near Mango Bridge Approach',
    description: 'Heavy vehicular traffic has caused road sub-base displacement and severe depression near bridge expansion joint.',
    category: 'Damaged Road',
    severity: 'High',
    status: 'Verified',
    assignedDepartment: 'Road Maintenance',
    coordinates: [86.2085, 22.8250],
    locationAddress: 'Mango Old Bridge Approach Road, North Bank',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    daysAgo: 5,
    confirmationsCount: 4,
    aiIssueType: 'Damaged Road',
    aiConfidence: 95,
    problemDetected: true,
    aiExplanation: 'Severe pavement shear cracking and structural depression detected.'
  },
  {
    title: 'Damaged Pedestrian Safety Railing on Overhead Footbridge',
    description: 'Section of iron handrail rusted through and broken off, leaving gap for walking school children.',
    category: 'Damaged Facility',
    severity: 'Low',
    status: 'Submitted',
    coordinates: [86.1890, 22.7980],
    locationAddress: 'Sonari Link Footbridge, Riverside Walkway',
    imageUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80',
    daysAgo: 0,
    confirmationsCount: 0,
    aiIssueType: 'Damaged Facility',
    aiConfidence: 88,
    problemDetected: true,
    aiExplanation: 'Pedestrian barrier separation and metallic corrosion identified.'
  },
  {
    title: 'Open Underground Stormwater Manhole Hazard',
    description: 'Cast-iron inspection chamber lid is missing. Citizens have placed tree branches as temporary warning markers.',
    category: 'Blocked Drain',
    severity: 'High',
    status: 'Assigned',
    assignedDepartment: 'Drainage',
    coordinates: [86.2110, 22.8060],
    locationAddress: 'Straight Mile Road, Near Agrico Signal',
    imageUrl: 'https://images.unsplash.com/photo-1584467735867-4297ae2ebcee?auto=format&fit=crop&w=800&q=80',
    daysAgo: 2,
    confirmationsCount: 6,
    aiIssueType: 'Blocked Drain',
    aiConfidence: 98,
    problemDetected: true,
    aiExplanation: 'High-risk unshielded aperture detected in public carriageway.'
  },
  {
    title: 'Hazardous Dangling Power Wire near Primary School',
    description: 'Low-hanging insulated service drop wire sagging within arm reach of pedestrians on sidewalk.',
    category: 'Streetlight',
    severity: 'High',
    status: 'Resolved',
    assignedDepartment: 'Electrical',
    coordinates: [86.1820, 22.8050],
    locationAddress: 'Kadma Farm Area, School Road',
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    daysAgo: 3,
    resolvedDaysAgo: 2,
    resolutionDescription: 'Overhead cables secured inside rigid PVC utility riser and tensioned with anchor clamps.',
    resolutionImageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    confirmationsCount: 5,
    aiIssueType: 'Streetlight',
    aiConfidence: 93,
    problemDetected: true,
    aiExplanation: 'Electrical transmission line sagging detected.'
  },
  {
    title: 'Commercial Vegetable Waste Left Outside Cold Storage',
    description: 'Rotting produce dumped on roadside shoulder creating odor and hygiene issues.',
    category: 'Garbage',
    severity: 'Low',
    status: 'Rejected',
    coordinates: [86.2230, 22.7980],
    locationAddress: 'Golmuri Market Wholesale Sector',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
    daysAgo: 4,
    confirmationsCount: 0,
    rejectedDaysAgo: 3,
    rejectionRemark: 'Private commercial premise responsibility. Referred to commercial health inspectors.',
    aiIssueType: 'Garbage',
    aiConfidence: 86,
    problemDetected: true,
    aiExplanation: 'Organic commercial refuse detected.'
  },
  {
    title: 'Municipal Pipeline Seepage Undermining Footpath Pavers',
    description: 'Continuous underground water seepage is destabilizing concrete interlocking tiles and causing mud pooling.',
    category: 'Water Leakage',
    severity: 'Medium',
    status: 'In Progress',
    assignedDepartment: 'Water',
    coordinates: [86.2410, 22.7780],
    locationAddress: 'Telco Colony, Sector B Inner Circle',
    imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80',
    daysAgo: 1,
    confirmationsCount: 3,
    aiIssueType: 'Water Leakage',
    aiConfidence: 91,
    problemDetected: true,
    aiExplanation: 'Subsurface moisture saturation and pavement destabilization detected.'
  },
  {
    title: 'Vandalized Public Park Fitness Equipment',
    description: 'Outdoor gymnasium parallel bars damaged and anchor bolts pulled out of concrete base.',
    category: 'Damaged Facility',
    severity: 'Low',
    status: 'Submitted',
    coordinates: [86.1920, 22.8140],
    locationAddress: 'Bhatia Park, Green Belt Sector 2',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
    daysAgo: 0,
    confirmationsCount: 1,
    aiIssueType: 'Damaged Facility',
    aiConfidence: 87,
    problemDetected: true,
    aiExplanation: 'Public recreation facility mechanical structural damage identified.'
  }
];

async function seedData() {
  console.log('====================================================');
  console.log('       Step 11: Demo Seed Data Generator           ');
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('1. Connected to MongoDB Atlas successfully.');

    // 1. Fetch Admin and Citizen users
    const adminUser = await User.findOne({ role: 'admin' });
    const citizenUser = await User.findOne({ role: 'citizen' });

    if (!adminUser) {
      throw new Error('Admin user not found. Please run createAdmin.js first.');
    }
    if (!citizenUser) {
      throw new Error('Citizen user not found in database.');
    }

    console.log(`2. User references found:`);
    console.log(`   - Admin: ${adminUser.name} (${adminUser.email})`);
    console.log(`   - Citizen: ${citizenUser.name} (${citizenUser.email})\n`);

    // 2. Insert demo issues idempotently
    console.log('3. Seeding realistic civic issues...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const demo of DEMO_ISSUES) {
      const existing = await Issue.findOne({ title: demo.title });
      if (existing) {
        console.log(`   [SKIP] Already exists: "${demo.title}"`);
        skippedCount++;
        continue;
      }

      // Calculate realistic creation & modification dates
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - demo.daysAgo);
      createdDate.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      let resolvedDate = null;
      if (demo.status === 'Resolved' && demo.resolvedDaysAgo !== undefined) {
        resolvedDate = new Date();
        resolvedDate.setDate(resolvedDate.getDate() - demo.resolvedDaysAgo);
        resolvedDate.setHours(16, 30);
      }

      let rejectedDate = null;
      if (demo.status === 'Rejected' && demo.rejectedDaysAgo !== undefined) {
        rejectedDate = new Date();
        rejectedDate.setDate(rejectedDate.getDate() - demo.rejectedDaysAgo);
        rejectedDate.setHours(11, 15);
      }

      // Create fake confirmation IDs using citizen user
      const confirmations = [];
      for (let c = 0; c < demo.confirmationsCount; c++) {
        confirmations.push(citizenUser._id);
      }

      // Build status history trail
      const statusHistory = [
        {
          status: 'Submitted',
          changedBy: citizenUser._id,
          changedAt: createdDate,
          remark: 'Report submitted by citizen with visual evidence'
        }
      ];

      if (['Under Review', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].includes(demo.status)) {
        const reviewDate = new Date(createdDate.getTime() + 1000 * 60 * 60 * 2);
        statusHistory.push({
          status: 'Under Review',
          changedBy: adminUser._id,
          changedAt: reviewDate,
          remark: 'Preliminary evaluation by municipal command center'
        });
      }

      if (['Verified', 'Assigned', 'In Progress', 'Resolved'].includes(demo.status)) {
        const verifiedDate = new Date(createdDate.getTime() + 1000 * 60 * 60 * 5);
        statusHistory.push({
          status: 'Verified',
          changedBy: adminUser._id,
          changedAt: verifiedDate,
          remark: 'Issue verified as genuine municipal defect'
        });
      }

      if (['Assigned', 'In Progress', 'Resolved'].includes(demo.status) && demo.assignedDepartment) {
        const assignDate = new Date(createdDate.getTime() + 1000 * 60 * 60 * 8);
        statusHistory.push({
          status: 'Assigned',
          changedBy: adminUser._id,
          changedAt: assignDate,
          remark: `Assigned to ${demo.assignedDepartment} field division`
        });
      }

      if (['In Progress', 'Resolved'].includes(demo.status)) {
        const progressDate = new Date(createdDate.getTime() + 1000 * 60 * 60 * 14);
        statusHistory.push({
          status: 'In Progress',
          changedBy: adminUser._id,
          changedAt: progressDate,
          remark: 'Field work crew dispatched and repair active'
        });
      }

      if (demo.status === 'Resolved' && resolvedDate) {
        statusHistory.push({
          status: 'Resolved',
          changedBy: adminUser._id,
          changedAt: resolvedDate,
          remark: demo.resolutionDescription || 'Issue resolved and verified by site inspection'
        });
      }

      if (demo.status === 'Rejected' && rejectedDate) {
        statusHistory.push({
          status: 'Rejected',
          changedBy: adminUser._id,
          changedAt: rejectedDate,
          remark: demo.rejectionRemark || 'Issue rejected after administrative verification'
        });
      }

      // Calculate priority score using authoritative service
      const priority = calculatePriority({
        severity: demo.severity,
        confirmations,
        aiConfidence: demo.aiConfidence,
        aiIssueType: demo.aiIssueType,
        problemDetected: demo.problemDetected,
        category: demo.category,
        createdAt: createdDate,
        status: demo.status
      });

      // Construct issue document
      const newIssue = new Issue({
        title: demo.title,
        description: demo.description,
        category: demo.category,
        severity: demo.severity,
        status: demo.status,
        imageUrl: demo.imageUrl,
        reportedBy: citizenUser._id,
        latitude: demo.coordinates[1],
        longitude: demo.coordinates[0],
        locationAddress: demo.locationAddress,
        location: {
          type: 'Point',
          coordinates: demo.coordinates
        },
        assignedDepartment: demo.assignedDepartment || null,
        assignedBy: demo.assignedDepartment ? adminUser._id : null,
        assignedAt: demo.assignedDepartment ? new Date(createdDate.getTime() + 1000 * 60 * 60 * 8) : null,
        verifiedAt: ['Verified', 'Assigned', 'In Progress', 'Resolved'].includes(demo.status) ? new Date(createdDate.getTime() + 1000 * 60 * 60 * 5) : null,
        verifiedBy: ['Verified', 'Assigned', 'In Progress', 'Resolved'].includes(demo.status) ? adminUser._id : null,
        resolvedAt: resolvedDate,
        resolvedBy: resolvedDate ? adminUser._id : null,
        resolutionDescription: demo.resolutionDescription || null,
        resolutionImageUrl: demo.resolutionImageUrl || null,
        rejectedAt: rejectedDate,
        rejectedBy: rejectedDate ? adminUser._id : null,
        confirmations,
        priorityScore: priority.score,
        priorityLevel: priority.level,
        priorityExplanation: priority.factors,
        statusHistory,
        aiConfidence: demo.aiConfidence,
        aiIssueType: demo.aiIssueType,
        problemDetected: demo.problemDetected,
        aiExplanation: demo.aiExplanation,
        createdAt: createdDate,
        updatedAt: resolvedDate || rejectedDate || createdDate
      });

      await newIssue.save();
      console.log(`   [INSERTED] "${demo.title}" (${demo.category} | ${demo.status} | Priority: ${priority.score} ${priority.level})`);
      insertedCount++;
    }

    console.log(`\n4. Seeding Summary:`);
    console.log(`   - Newly Inserted: ${insertedCount}`);
    console.log(`   - Previously Existing: ${skippedCount}`);
    console.log(`   - Total Active Demo Issues: ${insertedCount + skippedCount}`);

    const totalInDb = await Issue.countDocuments();
    console.log(`   - Total Issues in MongoDB Atlas: ${totalInDb}\n`);

    console.log('====================================================');
    console.log(' [PASS] Step 11 Demo Seed Data Generated Cleanly!   ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n[FAIL] Error during seeding:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
