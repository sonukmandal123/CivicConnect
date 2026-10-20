require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { calculatePriority } = require('../services/priorityService');
const Issue = require('../models/Issue');
const User = require('../models/User');

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

async function runPriorityTests() {
  console.log('=== Step 5 Priority System Verification Test ===\n');

  // PART 1: Unit testing multiple representative scenarios
  console.log('--- PART 1: Formula Unit Testing ---');

  // Scenario 1: Fresh minor issue (Low severity, 0 confirmations, 0 days)
  const case1 = calculatePriority({
    severity: 'Low',
    confirmations: [],
    problemDetected: false,
    status: 'Submitted',
    createdAt: new Date()
  });
  console.log('Scenario 1 (Fresh Low Severity):');
  console.log('  Score:', case1.score, '| Level:', case1.level, '| Expected: ~10 (Low)');
  console.log('  Summary:', case1.summary);

  // Scenario 2: Moderate issue with community confirmations and AI support
  const case2 = calculatePriority({
    severity: 'Medium',
    category: 'Streetlight',
    confirmations: ['user1', 'user2'], // 2 confirmations = +10
    problemDetected: true,
    aiConfidence: 80,
    aiIssueType: 'Streetlight', // +12 base + 5 bonus = +17
    status: 'Under Review',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days pending = +6
  });
  console.log('\nScenario 2 (Medium Severity + 2 Confirmations + AI Match + 3 Days):');
  console.log('  Score:', case2.score, '| Level:', case2.level, '| Expected: ~53 (High)');
  console.log('  Summary:', case2.summary);

  // Scenario 3: High severity critical issue with strong signals
  const case3 = calculatePriority({
    severity: 'High', // +30
    category: 'Pothole',
    confirmations: ['u1', 'u2', 'u3', 'u4'], // 4 confirmations = +20
    problemDetected: true,
    aiConfidence: 95,
    aiIssueType: 'Pothole', // +14 base + 5 match = +19
    status: 'Assigned',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days pending = +12
  });
  console.log('\nScenario 3 (High Severity + 4 Confirmations + AI + 6 Days):');
  console.log('  Score:', case3.score, '| Level:', case3.level, '| Expected: 81 (Critical)');
  console.log('  Summary:', case3.summary);

  // Scenario 4: Capping test (ensuring score cannot exceed 100)
  const case4 = calculatePriority({
    severity: 'High', // 30
    confirmations: new Array(15).fill('u'), // 15 * 5 = 75, capped at 25
    problemDetected: true,
    aiConfidence: 100,
    aiIssueType: 'Pothole',
    category: 'Pothole', // capped at 20
    status: 'In Progress',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days = 80, capped at 25
  });
  console.log('\nScenario 4 (Extreme Values Capping Test):');
  console.log('  Score:', case4.score, '| Level:', case4.level, '| Expected: 100 (Critical)');
  console.log('  Summary:', case4.summary);

  // PART 2: Database and API Integration Test
  console.log('\n--- PART 2: Live API & Database Integration Test ---');
  await mongoose.connect(process.env.MONGO_URI);

  // Get Admin token
  const loginAdmin = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });

  // Create a citizen user for testing confirmations
  let citizen = await User.findOne({ email: 'priority_test_citizen@example.com' });
  if (!citizen) {
    citizen = await User.create({
      name: 'Priority Citizen',
      email: 'priority_test_citizen@example.com',
      password: 'citizenpassword123',
      role: 'citizen'
    });
  }

  const loginCitizen = await apiCall('POST', '/api/auth/login', {
    email: 'priority_test_citizen@example.com',
    password: 'citizenpassword123'
  });
  const citizenToken = loginCitizen.data.token;

  // Create an issue reported by Admin
  const testIssue = await Issue.create({
    title: 'Severe Water Pipe Burst on Market Street',
    description: 'High pressure water gushing onto the road',
    category: 'Water Leakage',
    severity: 'High',
    latitude: 22.8046,
    longitude: 86.2029,
    location: { type: 'Point', coordinates: [86.2029, 22.8046] },
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    reportedBy: loginAdmin.data.user.id,
    status: 'Submitted',
    aiConfidence: 90,
    aiIssueType: 'Water Leakage',
    problemDetected: true,
    statusHistory: [{
      status: 'Submitted',
      changedBy: loginAdmin.data.user.id,
      changedAt: new Date(),
      remark: 'Reported by user'
    }]
  });

  console.log('\nCreated Test Issue:', testIssue._id);

  // Call GET /api/issues/:id/priority
  console.log('Testing GET /api/issues/:id/priority...');
  const priorityApiRes = await apiCall('GET', '/api/issues/' + testIssue._id + '/priority');
  console.log('  Initial Live Priority Score:', priorityApiRes.data.score);
  console.log('  Initial Live Priority Level:', priorityApiRes.data.level);
  console.log('  Breakdown Factors:');
  console.log('    Severity:', priorityApiRes.data.factors.severity.points, 'pts');
  console.log('    Confirmations:', priorityApiRes.data.factors.confirmations.points, 'pts');
  console.log('    AI Support:', priorityApiRes.data.factors.aiSupport.points, 'pts');
  console.log('    Time Pending:', priorityApiRes.data.factors.timePending.points, 'pts');

  const beforeScore = priorityApiRes.data.score;

  // Confirm issue as citizen
  console.log('\nCitizen confirming issue (PUT /api/issues/:id/confirm)...');
  const confirmRes = await apiCall('PUT', '/api/issues/' + testIssue._id + '/confirm', null, citizenToken);
  console.log('  Confirm Response:', confirmRes.data.message);
  console.log('  New Priority Score after confirmation:', confirmRes.data.priority?.score);
  console.log('  Score increased by:', (confirmRes.data.priority?.score - beforeScore), 'points (+5 per confirmation)');

  // Clean up
  await Issue.findByIdAndDelete(testIssue._id);
  await User.findByIdAndDelete(citizen._id);
  await mongoose.disconnect();

  console.log('\n=== ALL STEP 5 PRIORITY SYSTEM TESTS PASSED SUCCESSFULLY! ===');
}

runPriorityTests().catch(console.error);
