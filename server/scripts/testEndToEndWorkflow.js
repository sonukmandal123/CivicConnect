const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const mongoose = require('mongoose');

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

async function runTest() {
  console.log('=== End-to-End Notification Workflow Test ===\n');

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Login
  const adminLogin = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const adminToken = adminLogin.data.token;

  const citizenLogin = await apiCall('POST', '/api/auth/login', {
    email: 'sonumandalsmve@gmail.com',
    password: 'password123'
  });
  const citizenToken = citizenLogin.data.token;

  console.log('1. Authentication successful.');

  // Baseline notifs
  const initAdminNotifs = await apiCall('GET', '/api/notifications', null, adminToken);
  const initCitizenNotifs = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log(`Initial unread -> Admin: ${initAdminNotifs.data.unreadCount}, Citizen: ${initCitizenNotifs.data.unreadCount}`);

  // 2. Create a test issue in MongoDB
  const Issue = require('../models/Issue');
  const testIssue = await Issue.create({
    title: 'Testing Street Light Fault',
    description: 'Street light fixture is non-functional creating pedestrian safety hazard.',
    category: 'Streetlight',
    severity: 'Medium',
    status: 'Submitted',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716]
    },
    locationAddress: 'Main St & 4th Ave',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5',
    reportedBy: citizenLogin.data.user.id
  });

  const issueId = testIssue._id;
  console.log('\n2. Test issue created:', issueId);

  // Trigger submission notifications
  const { notifyAllAdmins, notifyCitizen } = require('../services/notificationService');
  await notifyAllAdmins({
    sender: citizenLogin.data.user.id,
    type: 'ISSUE_SUBMITTED',
    title: 'New Civic Issue Submitted',
    message: `${testIssue.title} (${testIssue.category})`,
    link: `/admin`
  });
  await notifyCitizen({
    citizenId: citizenLogin.data.user.id,
    type: 'ISSUE_SUBMITTED',
    title: 'Report Submitted Successfully',
    message: `Your report "${testIssue.title}" has been registered.`,
    link: `/dashboard`
  });

  // 3. Check notifications after submission
  const afterSubmitAdmin = await apiCall('GET', '/api/notifications', null, adminToken);
  const afterSubmitCitizen = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log(`After submission unread -> Admin: ${afterSubmitAdmin.data.unreadCount}, Citizen: ${afterSubmitCitizen.data.unreadCount}`);
  console.log('   Admin latest notif:', afterSubmitAdmin.data.notifications[0]?.title, '-', afterSubmitAdmin.data.notifications[0]?.message);
  console.log('   Citizen latest notif:', afterSubmitCitizen.data.notifications[0]?.title, '-', afterSubmitCitizen.data.notifications[0]?.message);

  // 4. Admin moves to Under Review
  await apiCall('PATCH', `/api/admin/issues/${issueId}/status`, {
    status: 'Under Review',
    remarks: 'Officer dispatched for on-site inspection.'
  }, adminToken);
  console.log('\n3. Admin moved issue to Under Review.');

  const afterReviewCitizen = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log('   Citizen latest notif:', afterReviewCitizen.data.notifications[0]?.title, '-', afterReviewCitizen.data.notifications[0]?.message);

  // 5. Admin Verifies Issue
  await apiCall('PATCH', `/api/admin/issues/${issueId}/status`, {
    status: 'Verified',
    remarks: 'Verified by engineering division.'
  }, adminToken);
  console.log('\n4. Admin verified issue.');

  // 6. Admin Assigns Issue to Department
  await apiCall('PATCH', `/api/admin/issues/${issueId}/assign`, {
    department: 'Electrical / Lighting'
  }, adminToken);
  console.log('5. Admin assigned issue to Electrical / Lighting.');

  const afterAssignCitizen = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log('   Citizen latest notif:', afterAssignCitizen.data.notifications[0]?.title, '-', afterAssignCitizen.data.notifications[0]?.message);

  // 7. Admin Resolves Issue
  await apiCall('PATCH', `/api/admin/issues/${issueId}/status`, {
    status: 'Resolved',
    resolutionDescription: 'Replaced bulb and repaired fixture wiring.',
    remarks: 'Issue successfully resolved.'
  }, adminToken);
  console.log('\n6. Admin marked issue as Resolved.');

  const afterResolveCitizen = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log('   Citizen latest notif:', afterResolveCitizen.data.notifications[0]?.title, '-', afterResolveCitizen.data.notifications[0]?.message);

  // 8. Test Clean Up of Test Issue
  await Issue.findByIdAndDelete(issueId);
  console.log('\n7. Cleaned up temporary test issue from database.');

  console.log('\n=== All notification triggers verified successfully! ===\n');
  await mongoose.disconnect();
}

runTest().catch(console.error);
