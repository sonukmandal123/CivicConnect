const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { notifyAllAdmins, notifyCitizen } = require('../services/notificationService');

async function testEmailWorkflow() {
  console.log('=== Testing Resend Email System Lifecycle ===\n');

  await mongoose.connect(process.env.MONGO_URI);

  // Find citizen and admin
  const citizen = await User.findOne({ email: 'sonumandalsmve@gmail.com' });
  const admin = await User.findOne({ role: 'admin' });

  if (!citizen) {
    console.error('Citizen Sonu Mandal (sonumandalsmve@gmail.com) not found in database.');
    return;
  }

  console.log(`Citizen: ${citizen.name} (${citizen.email})`);
  console.log(`Admin: ${admin.name} (${admin.email})`);

  // 1. Create a simulated civic report
  const testIssue = await Issue.create({
    title: 'Hazardous Open Manhole on 5th Crossroad',
    description: 'Manhole cover has collapsed creating severe danger for night traffic and pedestrians near the public library.',
    category: 'Damaged Road',
    severity: 'High',
    status: 'Submitted',
    priorityScore: 78,
    priorityLevel: 'High',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716]
    },
    locationAddress: '5th Crossroad, near Central Library, Sector 3',
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
    reportedBy: citizen._id,
    aiConfidence: 94,
    aiIssueType: 'Damaged Road',
    aiExplanation: 'Structural collapse of storm drainage/manhole lid detected in direct pathway.'
  });

  console.log('\n[Step 1] Created test issue:', testIssue._id.toString());

  // A. Trigger Admin New Issue Email Alert
  console.log('\nSending Admin Alert Email...');
  await notifyAllAdmins({
    sender: citizen._id,
    issue: testIssue,
    type: 'ISSUE_SUBMITTED',
    title: 'New Civic Issue Reported',
    message: `${citizen.name} reported a new ${testIssue.severity} severity ${testIssue.category}: "${testIssue.title}".`,
    link: `/admin/issues/${testIssue._id}`
  });

  // B. Trigger Citizen Confirmation Email
  console.log('Sending Citizen Submission Confirmation Email...');
  await notifyCitizen({
    citizenId: citizen._id,
    issue: testIssue,
    type: 'ISSUE_SUBMITTED',
    title: 'Report Submitted Successfully',
    message: `Your report "${testIssue.title}" has been registered in the municipal database.`,
    link: `/issues/${testIssue._id}`
  });

  // Wait 2.5 seconds between steps for rate limit gentleness and delivery sequencing
  await new Promise(r => setTimeout(r, 2500));

  // 2. Simulate Admin Moving to 'Under Review'
  testIssue.status = 'Under Review';
  await testIssue.save();

  console.log('\n[Step 2] Status -> Under Review. Sending Citizen Milestone Email...');
  await notifyCitizen({
    citizenId: citizen._id,
    sender: admin._id,
    issue: testIssue,
    type: 'STATUS_CHANGED',
    title: 'Report Under Review',
    message: 'Municipal engineering inspection team assigned to evaluate physical manhole hazard.',
    link: `/issues/${testIssue._id}`
  });

  await new Promise(r => setTimeout(r, 2500));

  // 3. Simulate Admin Assigning Department
  testIssue.status = 'Assigned';
  testIssue.assignedDepartment = 'Road Infrastructure & Public Works';
  await testIssue.save();

  console.log('\n[Step 3] Status -> Assigned. Sending Citizen Milestone Email...');
  await notifyCitizen({
    citizenId: citizen._id,
    sender: admin._id,
    issue: testIssue,
    type: 'ISSUE_ASSIGNED',
    title: 'Department Assigned',
    message: 'Work order dispatched to Road Infrastructure & Public Works rapid repair division.',
    link: `/issues/${testIssue._id}`
  });

  await new Promise(r => setTimeout(r, 2500));

  // 4. Simulate Admin Marking Resolved
  testIssue.status = 'Resolved';
  testIssue.resolutionDescription = 'Heavy-duty cast iron manhole cover installed with reinforced concrete seating ring. Road surface leveled.';
  testIssue.resolutionImageUrl = 'https://images.unsplash.com/photo-1590496793929-36417d3117de';
  await testIssue.save();

  console.log('\n[Step 4] Status -> Resolved. Sending Citizen Completion Email with Proof Photo...');
  await notifyCitizen({
    citizenId: citizen._id,
    sender: admin._id,
    issue: testIssue,
    type: 'ISSUE_RESOLVED',
    title: 'Issue Resolved',
    message: 'Repair completed successfully. Please review photo proof and verify resolution.',
    link: `/issues/${testIssue._id}`
  });

  // Clean up test issue
  await Issue.findByIdAndDelete(testIssue._id);
  console.log('\nCleaned up temporary issue from MongoDB.');

  // Give background promises a moment to finish dispatch
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n=== All Email Milestones Dispatched via Resend! Check your inbox (sonumandalsmve@gmail.com)! ===\n');
  await mongoose.disconnect();
}

testEmailWorkflow().catch(console.error);
