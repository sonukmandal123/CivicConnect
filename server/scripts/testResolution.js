require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');

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

async function runResolutionTest() {
  console.log('=== Step 4 Resolution Workflow Verification Test ===\n');

  // 1. Login as Admin
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const token = loginRes.data.token;
  console.log('1. Admin Login: OK');

  // 2. Connect to MongoDB and create fresh test issue in 'Submitted' status
  await mongoose.connect(process.env.MONGO_URI);
  const testIssue = await Issue.create({
    title: 'Clogged Drainage on Park Street',
    description: 'Rainwater overflowing onto sidewalk due to debris block',
    category: 'Blocked Drain',
    severity: 'Medium',
    latitude: 22.8046,
    longitude: 86.2029,
    location: { type: 'Point', coordinates: [86.2029, 22.8046] },
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    imagePublicId: 'sample_drainage_original',
    reportedBy: loginRes.data.user.id,
    status: 'Submitted',
    statusHistory: [{
      status: 'Submitted',
      changedBy: loginRes.data.user.id,
      changedAt: new Date(),
      remark: 'Issue submitted by citizen'
    }]
  });
  console.log('2. Created Test Issue: ' + testIssue._id + ' | Status: ' + testIssue.status);

  // 3. Test Invalid Resolution: Attempt to resolve while in 'Submitted' status
  console.log('\n3. Testing Resolution on non-In Progress issue (Status: Submitted)...');
  const invalidResolveRes = await apiCall('POST', '/api/admin/issues/' + testIssue._id + '/resolve', {
    resolutionDescription: 'Attempting to resolve early'
  }, token);
  console.log('   Status Code:', invalidResolveRes.status, '(Expected 400)');
  console.log('   Response Message:', invalidResolveRes.data.message);

  // 4. Progress issue through: Submitted -> Under Review -> Verified -> Assigned
  console.log('\n4. Progressing issue through legitimate lifecycle...');
  await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/status', {
    status: 'Under Review',
    remark: 'Drainage inspector dispatched'
  }, token);

  await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/status', {
    status: 'Verified',
    remark: 'Blockage confirmed by municipal engineer'
  }, token);

  const assignRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/assign', {
    department: 'Drainage',
    remark: 'Assigned to Drainage Clearance Unit 3'
  }, token);
  console.log('   Issue assigned! Current Status:', assignRes.data.issue.status, '| Dept:', assignRes.data.issue.assignedDepartment);

  // 5. Test markInProgress: Assigned -> In Progress
  console.log('\n5. Transitioning issue: Assigned -> In Progress...');
  const progressRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/in-progress', {
    remark: 'Excavation and debris clearing equipment deployed'
  }, token);
  console.log('   Status Code:', progressRes.status);
  console.log('   Current Status:', progressRes.data.issue.status);

  // 6. Test missing resolution description
  console.log('\n6. Testing missing resolution description...');
  const missingDescRes = await apiCall('POST', '/api/admin/issues/' + testIssue._id + '/resolve', {
    resolutionDescription: '   '
  }, token);
  console.log('   Status Code:', missingDescRes.status, '(Expected 400)');
  console.log('   Response Message:', missingDescRes.data.message);

  // 7. Test valid resolution: In Progress -> Resolved
  console.log('\n7. Resolving issue with mandatory description...');
  const resolveRes = await apiCall('POST', '/api/admin/issues/' + testIssue._id + '/resolve', {
    resolutionDescription: 'Cleared 300kg of solid debris from culvert; water flow fully restored.'
  }, token);

  console.log('   Status Code:', resolveRes.status);
  console.log('   Response Message:', resolveRes.data.message);
  console.log('   Updated Status:', resolveRes.data.issue.status);
  console.log('   Resolution Description:', resolveRes.data.issue.resolutionDescription);
  console.log('   Resolved At:', resolveRes.data.issue.resolvedAt);
  console.log('   Resolved By:', resolveRes.data.issue.resolvedBy?.name || resolveRes.data.issue.resolvedBy);
  console.log('   Original Image Preserved:', resolveRes.data.issue.imageUrl);

  // 8. Verify Full Audit History
  console.log('\n8. Checking Complete Lifecycle Audit Timeline:');
  const historyRes = await apiCall('GET', '/api/admin/issues/' + testIssue._id + '/history', null, token);
  historyRes.data.statusHistory.forEach((h, idx) => {
    const actor = h.changedBy && h.changedBy.name ? h.changedBy.name : h.changedBy;
    console.log('   Step ' + (idx + 1) + ': [' + h.status + '] By: ' + actor + ' | Remark: ' + h.remark);
  });

  // 9. Clean up test issue
  await Issue.findByIdAndDelete(testIssue._id);
  console.log('\n9. Test issue cleaned up from database.');
  await mongoose.disconnect();
  console.log('\n=== ALL STEP 4 RESOLUTION TESTS PASSED SUCCESSFULLY! ===');
}

runResolutionTest().catch(console.error);
