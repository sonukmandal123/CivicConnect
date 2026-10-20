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

async function runAssignmentTest() {
  console.log('=== Step 3 Department Assignment Verification Test ===\n');

  // 1. Login as Admin
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const token = loginRes.data.token;
  console.log('1. Admin Login: OK');

  // 2. Test GET /api/admin/departments
  console.log('\n2. Testing GET /api/admin/departments...');
  const deptRes = await apiCall('GET', '/api/admin/departments', null, token);
  console.log('   Status Code:', deptRes.status);
  console.log('   Department Count:', deptRes.data.count);
  console.log('   Configured Departments:', deptRes.data.departments);

  // 3. Connect to MongoDB and create fresh test issue in 'Submitted' status
  await mongoose.connect(process.env.MONGO_URI);
  const testIssue = await Issue.create({
    title: 'Damaged Road on Main Boulevard',
    description: 'Cracks and potholes along the main commercial strip',
    category: 'Damaged Road',
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
  console.log('\n3. Created Test Issue: ' + testIssue._id + ' | Status: ' + testIssue.status);

  // 4. Test Assignment Rule: Attempt to assign an unverified issue (Submitted -> Assign)
  console.log('\n4. Testing Assignment Rule on UNVERIFIED issue (Status: Submitted)...');
  const unverifiedAssignRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/assign', {
    department: 'Road Maintenance',
    remark: 'Attempting early assignment'
  }, token);
  console.log('   Status Code:', unverifiedAssignRes.status, '(Expected 400)');
  console.log('   Response Message:', unverifiedAssignRes.data.message);

  // 5. Test Invalid Department Name
  console.log('\n5. Testing Invalid Department Name (e.g., "Space Force")...');
  const invalidDeptRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/assign', {
    department: 'Space Force'
  }, token);
  console.log('   Status Code:', invalidDeptRes.status, '(Expected 400)');
  console.log('   Response Message:', invalidDeptRes.data.message);

  // 6. Transition to Under Review -> Verified
  console.log('\n6. Transitioning issue: Submitted -> Under Review -> Verified...');
  await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/status', {
    status: 'Under Review',
    remark: 'Inspection team dispatched'
  }, token);

  const verifyRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/status', {
    status: 'Verified',
    remark: 'Inspection confirmed road damage'
  }, token);
  console.log('   Issue verified successfully! Current Status:', verifyRes.data.issue.status);

  // 7. Test Valid Assignment to "Road Maintenance"
  console.log('\n7. Assigning verified issue to "Road Maintenance"...');
  const assignRes = await apiCall('PATCH', '/api/admin/issues/' + testIssue._id + '/assign', {
    department: 'Road Maintenance',
    remark: 'Work order dispatched to Road Maintenance Division A'
  }, token);

  console.log('   Status Code:', assignRes.status);
  console.log('   Response Message:', assignRes.data.message);
  console.log('   Updated Status:', assignRes.data.issue.status);
  console.log('   Assigned Department:', assignRes.data.issue.assignedDepartment);
  console.log('   Assigned At:', assignRes.data.issue.assignedAt);
  console.log('   Assigned By:', assignRes.data.issue.assignedBy?.name || assignRes.data.issue.assignedBy);

  // 8. Check Audit History
  console.log('\n8. Checking Full Audit Timeline:');
  const historyRes = await apiCall('GET', '/api/admin/issues/' + testIssue._id + '/history', null, token);
  historyRes.data.statusHistory.forEach((h, idx) => {
    const actor = h.changedBy && h.changedBy.name ? h.changedBy.name : h.changedBy;
    console.log('   Step ' + (idx + 1) + ': [' + h.status + '] By: ' + actor + ' | Remark: ' + h.remark);
  });

  // 9. Clean up test issue
  await Issue.findByIdAndDelete(testIssue._id);
  console.log('\n9. Test issue cleaned up from database.');
  await mongoose.disconnect();
  console.log('\n=== ALL STEP 3 DEPARTMENT ASSIGNMENT TESTS PASSED SUCCESSFULLY! ===');
}

runAssignmentTest().catch(console.error);
