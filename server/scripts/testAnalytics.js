require('dotenv').config();
const http = require('http');

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

async function runAnalyticsTest() {
  console.log('====================================================');
  console.log('   Step 8: Analytics Backend Aggregations Test     ');
  console.log('====================================================\n');

  // 1. Verify Unauthenticated Access is Blocked
  console.log('1. Testing Security: Unauthenticated request to /api/admin/analytics...');
  const unauthRes = await apiCall('GET', '/api/admin/analytics');
  console.log(`   Response status: ${unauthRes.status} (Expected 401 Unauthorized)`);
  if (unauthRes.status !== 401) {
    throw new Error('Security check failed: unauthenticated user was not blocked.');
  }
  console.log('   Security verification: PASS\n');

  // 2. Admin Login
  console.log('2. Authenticating as Municipal Administrator...');
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  if (loginRes.status !== 200 || !loginRes.data.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.data));
  }
  const token = loginRes.data.token;
  const user = loginRes.data.user || {};
  console.log(`   Logged in as: ${user.name || 'Admin'} (${user.role || 'admin'})`);
  console.log('   JWT Token obtained: PASS\n');

  // 3. Complete Analytics Payload
  console.log('3. Testing GET /api/admin/analytics (Full Aggregation Suite)...');
  const fullRes = await apiCall('GET', '/api/admin/analytics', null, token);
  console.log(`   HTTP Status: ${fullRes.status}`);
  if (fullRes.status !== 200 || !fullRes.data.success) {
    throw new Error('Failed to fetch full analytics: ' + JSON.stringify(fullRes.data));
  }
  
  const analytics = fullRes.data.data;
  console.log('   Summary KPIs:');
  console.log(`     - Total Issues: ${analytics.summary.totalIssues}`);
  console.log(`     - Pending Review: ${analytics.summary.pendingReview} (Submitted: ${analytics.summary.submitted}, Under Review: ${analytics.summary.underReview})`);
  console.log(`     - In Progress: ${analytics.summary.inProgress}`);
  console.log(`     - Resolved: ${analytics.summary.resolved}`);
  console.log(`     - Rejected: ${analytics.summary.rejected}`);
  console.log(`     - Critical Priority Issues: ${analytics.summary.criticalPriority}`);
  console.log(`     - High Priority Issues: ${analytics.summary.highPriority}`);

  console.log('\n   Category Breakdown ($group & $project):');
  analytics.categories.forEach(c => {
    console.log(`     - ${c.category}: ${c.count} issue(s)`);
  });

  console.log('\n   Status Distribution:');
  analytics.statuses.forEach(s => {
    console.log(`     - ${s.status}: ${s.count} issue(s)`);
  });

  console.log('\n   Priority Distribution:');
  analytics.priorities.forEach(p => {
    console.log(`     - ${p.priorityLevel}: ${p.count} issue(s)`);
  });

  console.log('\n   Resolution Metrics ($subtract, $divide, $avg):');
  console.log(`     - Total Resolved: ${analytics.resolution.totalResolved}`);
  console.log(`     - Avg Resolution Time: ${analytics.resolution.avgResolutionHours} hrs (~${analytics.resolution.avgResolutionDays} days)`);
  console.log(`     - Fastest Resolution: ${analytics.resolution.fastestHours} hrs`);
  console.log(`     - Longest Resolution: ${analytics.resolution.longestHours} hrs`);

  console.log('\n   Community Engagement Metrics ($cond, $size, $avg):');
  console.log(`     - Total Confirmations Recorded: ${analytics.community.totalConfirmations}`);
  console.log(`     - Avg Confirmations per Issue: ${analytics.community.avgConfirmationsPerIssue}`);
  console.log(`     - Top Confirmed Issues Count: ${analytics.community.topConfirmedIssues?.length || 0}`);

  console.log('\n   AI Assistive Vision Metrics:');
  console.log(`     - Total Inspected by AI: ${analytics.ai.totalWithAI}`);
  console.log(`     - Avg Confidence Score: ${analytics.ai.avgConfidence}`);
  console.log(`     - Problem Detection Rate: ${analytics.ai.problemDetectionRate}`);
  console.log(`     - Categories Detected by AI:`, analytics.ai.aiDetectedCategories);

  // 4. Test Granular Sub-Endpoints
  console.log('\n4. Testing Granular Sub-Endpoints...');
  const [summaryRes, categoryRes, resRes, commRes, aiRes] = await Promise.all([
    apiCall('GET', '/api/admin/analytics/summary', null, token),
    apiCall('GET', '/api/admin/analytics/categories', null, token),
    apiCall('GET', '/api/admin/analytics/resolution', null, token),
    apiCall('GET', '/api/admin/analytics/community', null, token),
    apiCall('GET', '/api/admin/analytics/ai', null, token)
  ]);

  console.log(`   /api/admin/analytics/summary: status ${summaryRes.status} -> success: ${summaryRes.data.success}`);
  console.log(`   /api/admin/analytics/categories: status ${categoryRes.status} -> count: ${categoryRes.data.categories?.length}`);
  console.log(`   /api/admin/analytics/resolution: status ${resRes.status} -> resolved: ${resRes.data.resolution?.totalResolved}`);
  console.log(`   /api/admin/analytics/community: status ${commRes.status} -> total confirmations: ${commRes.data.community?.totalConfirmations}`);
  console.log(`   /api/admin/analytics/ai: status ${aiRes.status} -> ai inspected: ${aiRes.data.ai?.totalWithAI}`);

  console.log('\n====================================================');
  console.log(' [PASS] Step 8 Analytics Aggregations Test Passed!   ');
  console.log('====================================================\n');
}

runAnalyticsTest().catch(err => {
  console.error('\n[FAIL] Test failed with error:', err);
  process.exit(1);
});
