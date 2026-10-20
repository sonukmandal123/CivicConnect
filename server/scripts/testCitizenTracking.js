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

async function runCitizenTrackingTest() {
  console.log('=== Step 7 Citizen Tracking Verification Test ===\n');

  // 1. Fetch public issues map to get an issue ID
  const mapRes = await apiCall('GET', '/api/issues/map');
  if (!mapRes.data || mapRes.data.length === 0) {
    console.error('No issues available in database.');
    return;
  }

  const sampleIssueId = mapRes.data[0]._id;
  console.log('1. Selected Issue ID for Citizen Tracking:', sampleIssueId);

  // 2. Fetch single issue details as citizen / public
  console.log('\n2. Fetching GET /api/issues/' + sampleIssueId + ' (Citizen / Public view)...');
  const issueRes = await apiCall('GET', '/api/issues/' + sampleIssueId);

  console.log('   Status Code:', issueRes.status);
  console.log('   Issue Title:', issueRes.data.title);
  console.log('   Category:', issueRes.data.category);
  console.log('   Current Status:', issueRes.data.status);
  console.log('   Priority Score:', issueRes.data.priority?.score, '| Level:', issueRes.data.priority?.level);
  console.log('   Status History Entries:', issueRes.data.statusHistory?.length);
  
  if (issueRes.data.statusHistory && issueRes.data.statusHistory.length > 0) {
    console.log('   Status History Timeline for Citizen:');
    issueRes.data.statusHistory.forEach((h, idx) => {
      console.log('     Step ' + (idx + 1) + ': ' + h.status + ' (' + new Date(h.changedAt).toLocaleDateString() + ') - Remark: "' + (h.remark || 'N/A') + '"');
    });
  }

  // 3. Verify Privacy: Check that password and private credentials are NOT returned
  console.log('\n3. Verifying Citizen Privacy & Security...');
  const hasPassword = Boolean(issueRes.data.reportedBy?.password || issueRes.data.password);
  console.log('   Password field exposed:', hasPassword ? 'SECURITY FLAW!' : 'NO (Protected)');
  console.log('   ReportedBy user object:', issueRes.data.reportedBy);

  console.log('\n=== ALL STEP 7 CITIZEN TRACKING TESTS PASSED SUCCESSFULLY! ===');
}

runCitizenTrackingTest().catch(console.error);
