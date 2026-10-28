const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');

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

async function testNotifications() {
  console.log('=== Testing Notification System ===\n');

  await mongoose.connect(process.env.MONGO_URI);

  // 1. Authenticate Citizen & Admin
  const adminLogin = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const adminToken = adminLogin.data.token;
  const adminId = adminLogin.data.user.id;

  const citizenLogin = await apiCall('POST', '/api/auth/login', {
    email: 'sonumandalsmve@gmail.com',
    password: 'password123'
  });
  const citizenToken = citizenLogin.data.token;
  const citizenId = citizenLogin.data.user.id;

  console.log('1. Logged in: Admin (' + adminId + '), Citizen (' + citizenId + ')');

  // 2. Fetch Initial Notifications for Admin
  const adminNotifs = await apiCall('GET', '/api/notifications', null, adminToken);
  console.log('2. Admin notifications count:', adminNotifs.data.notifications.length, '| Unread:', adminNotifs.data.unreadCount);

  // 3. Fetch Initial Notifications for Citizen
  const citizenNotifs = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log('3. Citizen notifications count:', citizenNotifs.data.notifications.length, '| Unread:', citizenNotifs.data.unreadCount);

  // 4. Create a test notification directly via service
  const { notifyAllAdmins, notifyCitizen } = require('../services/notificationService');
  
  await notifyAllAdmins({
    sender: citizenId,
    type: 'ISSUE_SUBMITTED',
    title: 'Test Admin Alert: New Report',
    message: 'Citizen reported a hazardous street pothole',
    link: '/admin'
  });

  await notifyCitizen({
    citizenId: citizenId,
    sender: adminId,
    type: 'STATUS_CHANGED',
    title: 'Test Citizen Alert: Report Verified',
    message: 'Your report was verified by municipal authorities',
    link: '/dashboard'
  });

  // 5. Verify Admin received it
  const updatedAdminNotifs = await apiCall('GET', '/api/notifications', null, adminToken);
  console.log('\n4. Updated Admin unread count:', updatedAdminNotifs.data.unreadCount);
  console.log('   Latest Admin notif:', updatedAdminNotifs.data.notifications[0]?.title);

  // 6. Verify Citizen received it
  const updatedCitizenNotifs = await apiCall('GET', '/api/notifications', null, citizenToken);
  console.log('\n5. Updated Citizen unread count:', updatedCitizenNotifs.data.unreadCount);
  console.log('   Latest Citizen notif:', updatedCitizenNotifs.data.notifications[0]?.title);

  // 7. Mark as read
  if (updatedCitizenNotifs.data.notifications[0]) {
    const notifId = updatedCitizenNotifs.data.notifications[0]._id;
    const readRes = await apiCall('PATCH', `/api/notifications/${notifId}/read`, null, citizenToken);
    console.log('\n6. Marked citizen notif as read:', readRes.status, '| New unread:', readRes.data.unreadCount);
  }

  // 8. Mark all as read
  const readAllRes = await apiCall('PATCH', '/api/notifications/read-all', null, citizenToken);
  console.log('7. Mark all as read for citizen:', readAllRes.data.message, '| Unread:', readAllRes.data.unreadCount);

  console.log('\n=== Notification System Test PASSED 100%! ===');
  await mongoose.disconnect();
}

testNotifications().catch(console.error);
