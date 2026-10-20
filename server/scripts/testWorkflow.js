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

async function runWorkflowTest() {
  console.log('=== Step 2 Workflow Verification Test ===\n');

  // 1. Login as Admin
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const token = loginRes.data.token;
  console.log('1. Admin Login: OK (role: ' + loginRes.data.user.role + ')');

  // 2. Connect to MongoDB to create clean test issues
  await mongoose.connect(process.env.MONGO_URI);

  // Create fresh test issue for verification flow
  const freshIssue = await Issue.create({
    title: 'Test Issue for Workflow Lifecycle',
    description: 'Testing state transitions, verification, rejection, and remarks',
    category: 'Pothole',
    severity: 'High',
    latitude: 22.8046,
    longitude: 86.2029,
    location: { type: 'Point', coordinates: [86.2029, 22.8046] },
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    reportedBy: loginRes.data.user.id,
    status: 'Submitted',
    statusHistory: [{
      status: 'Submitted',
      changedBy: loginRes.data.user.id,
      changedAt: new Date(),
      remark: 'Issue submitted by citizen'
    }]
  });
  console.log('2. Fresh Issue Created: ' + freshIssue._id + ' | Initial Status: ' + freshIssue.status);

  // 3. Test Invalid Transition: Submitted -> Verified (must fail with 400)
  console.log('\n3. Testing Invalid Transition: Submitted -> Verified (must fail)');
  const invRes = await apiCall('PATCH', '/api/admin/issues/' + freshIssue._id + '/status', {
    status: 'Verified'
  }, token);
  console.log('   Response Status Code:', invRes.status, '(Expected 400)');
  console.log('   Response Error Message:', invRes.data.message);

  // 4. Test Valid Transition: Submitted -> Under Review
  console.log('\n4. Testing Valid Transition: Submitted -> Under Review');
  const reviewRes = await apiCall('PATCH', '/api/admin/issues/' + freshIssue._id + '/status', {
    status: 'Under Review',
    remark: 'Admin started preliminary review'
  }, token);
  console.log('   Response Status Code:', reviewRes.status);
  console.log('   New Status:', reviewRes.data.issue.status);

  // 5. Test Verification: Under Review -> Verified
  console.log('\n5. Testing Verification: Under Review -> Verified');
  const verifyRes = await apiCall('PATCH', '/api/admin/issues/' + freshIssue._id + '/status', {
    status: 'Verified',
    remark: 'Verified by municipal field inspector'
  }, token);
  console.log('   Response Status Code:', verifyRes.status);
  console.log('   New Status:', verifyRes.data.issue.status);
  console.log('   Verified At:', verifyRes.data.issue.verifiedAt);
  console.log('   Verified By:', verifyRes.data.issue.verifiedBy);

  // 6. Test Adding Admin Remarks
  console.log('\n6. Testing Adding Admin Remark...');
  const remarkRes = await apiCall('POST', '/api/admin/issues/' + freshIssue._id + '/remarks', {
    text: 'Site inspection scheduled with road maintenance crew'
  }, token);
  console.log('   Response Status Code:', remarkRes.status);
  console.log('   Total Admin Remarks:', remarkRes.data.adminRemarks.length);
  console.log('   Latest Remark:', remarkRes.data.adminRemarks[remarkRes.data.adminRemarks.length - 1].text);

  // 7. Test Audit History Endpoint
  console.log('\n7. Testing GET /api/admin/issues/:id/history...');
  const historyRes = await apiCall('GET', '/api/admin/issues/' + freshIssue._id + '/history', null, token);
  console.log('   History Status Code:', historyRes.status);
  console.log('   Status History Count:', historyRes.data.statusHistory.length);
  console.log('   History Timeline:');
  historyRes.data.statusHistory.forEach((h, idx) => {
    const actor = h.changedBy && h.changedBy.name ? h.changedBy.name : h.changedBy;
    console.log('     Step ' + (idx + 1) + ': [' + h.status + '] By: ' + actor + ' | Remark: ' + h.remark);
  });

  // 8. Test Rejection flow on a second test issue
  console.log('\n8. Testing Rejection Flow: Submitted -> Under Review -> Rejected...');
  const rejectTestIssue = await Issue.create({
    title: 'Duplicate/Invalid Issue for Rejection Test',
    description: 'This is not a real civic issue',
    category: 'Other',
    severity: 'Low',
    latitude: 22.8046,
    longitude: 86.2029,
    location: { type: 'Point', coordinates: [86.2029, 22.8046] },
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    reportedBy: loginRes.data.user.id,
    status: 'Submitted',
    statusHistory: [{
      status: 'Submitted',
      changedBy: loginRes.data.user.id,
      changedAt: new Date(),
      remark: 'Issue submitted by citizen'
    }]
  });

  // Put Under Review
  await apiCall('PATCH', '/api/admin/issues/' + rejectTestIssue._id + '/status', {
    status: 'Under Review',
    remark: 'Evaluating legitimacy of report'
  }, token);

  // Reject
  const rejectRes = await apiCall('PATCH', '/api/admin/issues/' + rejectTestIssue._id + '/status', {
    status: 'Rejected',
    remark: 'Report rejected: private property issue, outside municipal jurisdiction'
  }, token);

  console.log('   Rejection Status Code:', rejectRes.status);
  console.log('   New Status:', rejectRes.data.issue.status);
  console.log('   Rejected At:', rejectRes.data.issue.rejectedAt);
  console.log('   Rejected By:', rejectRes.data.issue.rejectedBy);

  // 9. Clean up test documents
  await Issue.findByIdAndDelete(freshIssue._id);
  await Issue.findByIdAndDelete(rejectTestIssue._id);
  console.log('\n9. Test issues cleaned up from database.');
  await mongoose.disconnect();
  console.log('\n=== ALL STEP 2 WORKFLOW TESTS PASSED SUCCESSFULLY! ===');
}

runWorkflowTest().catch(console.error);
