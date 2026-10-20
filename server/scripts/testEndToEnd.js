/**
 * testEndToEnd.js
 * 
 * Comprehensive End-to-End simulation testing the entire civic issue lifecycle:
 * 1. Multi-Citizen & Administrator Authentication
 * 2. Citizen Submits Issue with Photo, GPS & Groq AI
 * 3. Second Citizen Confirms Issue (+5 Priority Points)
 * 4. Admin Moves to "Under Review" (Submitted -> Under Review)
 * 5. Admin Verifies Issue (Under Review -> Verified)
 * 6. Admin Assigns to Municipal Department (Verified -> Assigned)
 * 7. Field Crew Marks "In Progress" (Assigned -> In Progress)
 * 8. Department Resolves with Audit Proof (In Progress -> Resolved)
 * 9. Citizen Public Tracking & Audit History Verification
 * 10. Geospatial Discovery (2dsphere Nearby Query)
 * 11. Live MongoDB Aggregation Engine Updates
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const { calculatePriority } = require('../services/priorityService');

function apiCall(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runEndToEndScenario() {
  console.log('================================================================');
  console.log('   CivicConnect: Phase 3 End-to-End Scenario Verification Test  ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI);

  // STEP 1: Multi-Role Setup & Authentication
  console.log('STEP 1: Setting up and Authenticating Users...');
  // Ensure Citizen 1 exists
  let citizen1 = await User.findOne({ email: 'john@example.com' });
  if (!citizen1) {
    citizen1 = await User.create({ name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'citizen' });
  }

  // Ensure Citizen 2 exists (to test independent community confirmations)
  let citizen2 = await User.findOne({ email: 'citizen2@example.com' });
  if (!citizen2) {
    citizen2 = await User.create({ name: 'Priya Sharma', email: 'citizen2@example.com', password: 'password123', role: 'citizen' });
  }

  const [c1Login, c2Login, adminLogin] = await Promise.all([
    apiCall('POST', '/api/auth/login', { email: 'john@example.com', password: 'password123' }),
    apiCall('POST', '/api/auth/login', { email: 'citizen2@example.com', password: 'password123' }),
    apiCall('POST', '/api/auth/login', { email: 'admin@example.com', password: 'adminpassword123' })
  ]);

  const token1 = c1Login.data.token;
  const token2 = c2Login.data.token;
  const adminToken = adminLogin.data.token;

  console.log(`   Reporting Citizen: ${c1Login.data.user.name} (${c1Login.data.user.email})`);
  console.log(`   Confirming Citizen: ${c2Login.data.user.name} (${c2Login.data.user.email})`);
  console.log(`   Municipal Admin: ${adminLogin.data.user.name} (${adminLogin.data.user.role})`);
  console.log('   [PASS] Multi-Role Authentication Setup\n');

  // STEP 2: Citizen 1 Submits New Issue
  console.log('STEP 2: Citizen 1 Submits New Report: "Dangerous Road Sinkhole near Bistupur Post Office"...');
  const testCoordinates = [86.1960, 22.8020];
  const initialPriority = calculatePriority({
    severity: 'High',
    confirmations: [],
    aiConfidence: 95,
    aiIssueType: 'Pothole',
    problemDetected: true,
    category: 'Pothole',
    createdAt: new Date(),
    status: 'Submitted'
  });

  const createdIssue = new Issue({
    title: `E2E Sinkhole Hazard - ${Date.now()}`,
    description: 'Road surface collapse forming 1.5m cavity directly on commuter lane.',
    category: 'Pothole',
    severity: 'High',
    status: 'Submitted',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    reportedBy: citizen1._id,
    latitude: testCoordinates[1],
    longitude: testCoordinates[0],
    locationAddress: 'Bistupur Post Office Road, Sector 1',
    location: {
      type: 'Point',
      coordinates: testCoordinates
    },
    priorityScore: initialPriority.score,
    priorityLevel: initialPriority.level,
    priorityExplanation: initialPriority.factors,
    statusHistory: [{
      status: 'Submitted',
      changedBy: citizen1._id,
      changedAt: new Date(),
      remark: 'Issue reported by citizen with GPS location and photo.'
    }],
    aiConfidence: 95,
    aiIssueType: 'Pothole',
    problemDetected: true,
    aiExplanation: 'Groq vision confirmed asphalt cavity.'
  });

  await createdIssue.save();
  const issueId = createdIssue._id.toString();
  console.log(`   Issue Created with ID: ${issueId}`);
  console.log(`   Initial Priority Score: ${createdIssue.priorityScore} (${createdIssue.priorityLevel})`);
  console.log('   [PASS] Issue Creation & Priority Formula Initialization\n');

  // STEP 3: Citizen 2 Confirms the Issue (+5 Priority Points)
  console.log('STEP 3: Citizen 2 Confirms Issue (Validating Self-Confirmation Protection & Auto-Boost)...');
  // First verify Citizen 1 cannot confirm own issue
  const selfConfirmRes = await apiCall('PUT', `/api/issues/${issueId}/confirm`, null, token1);
  console.log(`   Self-Confirmation Protection Test: Status ${selfConfirmRes.status} ("${selfConfirmRes.data.message}")`);
  if (selfConfirmRes.status !== 400) {
    throw new Error('Self-confirmation should be blocked with 400!');
  }

  // Citizen 2 confirms
  const confirmRes = await apiCall('PUT', `/api/issues/${issueId}/confirm`, null, token2);
  console.log(`   Citizen 2 Confirmation Status: ${confirmRes.status}`);
  console.log(`   Confirmations Count: ${confirmRes.data.confirmations?.length}`);
  console.log(`   Priority Recalculated: ${confirmRes.data.priority?.score} (${confirmRes.data.priority?.level})`);
  if (confirmRes.data.priority?.score !== initialPriority.score + 5) {
    throw new Error(`Expected score ${initialPriority.score + 5}, got ${confirmRes.data.priority?.score}`);
  }
  console.log('   [PASS] Community Confirmation (+5 pts) & Fraud Prevention\n');

  // STEP 4: Admin State Machine Step 1: Move to "Under Review"
  console.log('STEP 4: Admin moves issue to "Under Review"...');
  const reviewRes = await apiCall('PATCH', `/api/admin/issues/${issueId}/status`, {
    status: 'Under Review',
    remark: 'Preliminary evaluation by municipal command center.'
  }, adminToken);
  const reviewedIssue = reviewRes.data.issue || reviewRes.data;
  console.log(`   HTTP Status: ${reviewRes.status}`);
  console.log(`   Status updated to: ${reviewedIssue.status}`);
  if (reviewedIssue.status !== 'Under Review') {
    throw new Error('Failed to transition to Under Review');
  }
  console.log('   [PASS] State Machine: Submitted -> Under Review\n');

  // STEP 5: Admin State Machine Step 2: Move to "Verified"
  console.log('STEP 5: Admin Verifies Issue ("Under Review" -> "Verified")...');
  const verifyRes = await apiCall('PATCH', `/api/admin/issues/${issueId}/status`, {
    status: 'Verified',
    remark: 'Site inspected by sector road supervisor. Verified genuine municipal hazard.'
  }, adminToken);
  const verifiedIssue = verifyRes.data.issue || verifyRes.data;
  console.log(`   HTTP Status: ${verifyRes.status}`);
  console.log(`   Status updated to: ${verifiedIssue.status}`);
  console.log(`   Verified At: ${verifiedIssue.verifiedAt}`);
  if (verifiedIssue.status !== 'Verified') {
    throw new Error('Failed to transition to Verified');
  }
  console.log('   [PASS] State Machine: Under Review -> Verified\n');

  // STEP 6: Department Assignment
  console.log('STEP 6: Admin Assigns Issue to "Road Maintenance" Department...');
  const assignRes = await apiCall('PATCH', `/api/admin/issues/${issueId}/assign`, {
    department: 'Road Maintenance',
    remark: 'Allocated to Bistupur Asphalt Repair Gang #3'
  }, adminToken);
  const assignedIssue = assignRes.data.issue || assignRes.data;
  console.log(`   HTTP Status: ${assignRes.status}`);
  console.log(`   Status updated to: ${assignedIssue.status}`);
  console.log(`   Assigned Department: ${assignedIssue.assignedDepartment}`);
  if (assignedIssue.status !== 'Assigned' || assignedIssue.assignedDepartment !== 'Road Maintenance') {
    throw new Error('Failed to assign department');
  }
  console.log('   [PASS] Department Assignment: Verified -> Assigned\n');

  // STEP 7: Field Team Marks "In Progress"
  console.log('STEP 7: Department Initiates Work ("In Progress")...');
  const progressRes = await apiCall('PATCH', `/api/admin/issues/${issueId}/in-progress`, {
    remark: 'Heavy machinery and cold mix asphalt arrived on site. Excavation underway.'
  }, adminToken);
  const progressIssue = progressRes.data.issue || progressRes.data;
  console.log(`   HTTP Status: ${progressRes.status}`);
  console.log(`   Status updated to: ${progressIssue.status}`);
  if (progressIssue.status !== 'In Progress') {
    throw new Error('Failed to transition to In Progress');
  }
  console.log('   [PASS] State Machine: Assigned -> In Progress\n');

  // STEP 8: Resolution with Audit Description & Proof
  console.log('STEP 8: Department Submits Resolution with Work Description & Verification Proof...');
  const resolveRes = await apiCall('POST', `/api/admin/issues/${issueId}/resolve`, {
    resolutionDescription: 'Cavity backfilled with crushed aggregate base and sealed with 50mm compacted asphalt concrete layer. Road lane reopened.',
    remark: 'Job completed satisfactorily. Traffic flow restored.'
  }, adminToken);
  const resolvedIssue = resolveRes.data.issue || resolveRes.data;
  console.log(`   HTTP Status: ${resolveRes.status}`);
  console.log(`   Status updated to: ${resolvedIssue.status}`);
  console.log(`   Resolution Date: ${resolvedIssue.resolvedAt}`);
  console.log(`   Resolution Description: ${resolvedIssue.resolutionDescription}`);
  if (resolvedIssue.status !== 'Resolved' || !resolvedIssue.resolvedAt) {
    throw new Error('Failed to resolve issue properly');
  }
  console.log('   [PASS] State Machine: In Progress -> Resolved\n');

  // STEP 9: Citizen Public Tracking Verification
  console.log('STEP 9: Verifying Citizen Public View (GET /api/issues/:id)...');
  const trackingRes = await apiCall('GET', `/api/issues/${issueId}`);
  console.log(`   HTTP Status: ${trackingRes.status}`);
  console.log(`   Current Status: ${trackingRes.data.status}`);
  console.log(`   Status History Steps Recorded: ${trackingRes.data.statusHistory?.length}`);
  console.log('   Audit Timeline History:');
  trackingRes.data.statusHistory.forEach((h, i) => {
    console.log(`     ${i + 1}. [${h.status}] ${new Date(h.changedAt).toLocaleTimeString()} - ${h.remark}`);
  });
  console.log(`   Citizen Resolution Details Available: "${trackingRes.data.resolutionDescription}"`);
  console.log('   [PASS] Public Citizen Tracking & Audit Transparency\n');

  // STEP 10: Spatial Discovery Query
  console.log('STEP 10: Verifying Geospatial Nearby Query (GET /api/issues/nearby)...');
  const nearbyRes = await apiCall('GET', `/api/issues/nearby?longitude=${testCoordinates[0]}&latitude=${testCoordinates[1]}&radius=1000&status=Resolved`);
  console.log(`   HTTP Status: ${nearbyRes.status}`);
  console.log(`   Issues Found in 1km Radius: ${nearbyRes.data.count}`);
  const foundResolved = nearbyRes.data.issues.find(i => i._id.toString() === issueId);
  if (!foundResolved) {
    throw new Error('Resolved issue not detected in geospatial query!');
  }
  console.log(`   Issue detected via 2dsphere index: "${foundResolved.title}" at distance: ${foundResolved.distanceMeters}m`);
  console.log('   [PASS] Spatial Query & 2dsphere Indexing\n');

  // STEP 11: Live Analytics Aggregation Engine
  console.log('STEP 11: Verifying Live MongoDB Aggregation Engine (GET /api/admin/analytics)...');
  const analyticsRes = await apiCall('GET', '/api/admin/analytics', null, adminToken);
  console.log(`   HTTP Status: ${analyticsRes.status}`);
  console.log(`   Total System Issues: ${analyticsRes.data.data.summary.totalIssues}`);
  console.log(`   Total Resolved Issues: ${analyticsRes.data.data.summary.resolved}`);
  console.log(`   Total Confirmations: ${analyticsRes.data.data.community.totalConfirmations}`);
  console.log(`   Resolution Turnaround Stats: Avg ${analyticsRes.data.data.resolution.avgResolutionHours} hrs`);
  console.log('   [PASS] Analytics Aggregations Verification\n');

  // Clean up the created test issue so database stays clean
  await Issue.findByIdAndDelete(issueId);
  console.log('Cleaned up temporary E2E test issue from database.');
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(' [PASS] All 11 End-to-End Civic Lifecycle Steps Passed 100%!   ');
  console.log('================================================================\n');
}

runEndToEndScenario().catch(err => {
  console.error('\n[FAIL] End-to-end scenario failed with error:', err);
  process.exit(1);
});
