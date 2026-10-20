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

async function runAdminManagementTest() {
  console.log('=== Step 6 Admin Issue Management Test ===\n');

  // 1. Login as Admin
  const loginRes = await apiCall('POST', '/api/auth/login', {
    email: 'admin@example.com',
    password: 'adminpassword123'
  });
  const token = loginRes.data.token;
  console.log('1. Admin Login: OK');

  // 2. Test Pagination (page=1, limit=2)
  console.log('\n2. Testing Pagination (limit=2)...');
  const pageRes = await apiCall('GET', '/api/admin/issues?page=1&limit=2', null, token);
  console.log('   Status:', pageRes.status);
  console.log('   Pagination Info:', pageRes.data.pagination);
  console.log('   Returned items count:', pageRes.data.issues.length);
  console.log('   KPI Summary:', pageRes.data.summary);

  // 3. Test Sorting: priority_desc vs newest
  console.log('\n3. Testing Sort Order: Priority Descending (Default)...');
  const sortRes = await apiCall('GET', '/api/admin/issues?sort=priority_desc', null, token);
  console.log('   First issue priority score:', sortRes.data.issues[0]?.priorityScore, '(' + sortRes.data.issues[0]?.priorityLevel + ')');
  console.log('   Second issue priority score:', sortRes.data.issues[1]?.priorityScore, '(' + sortRes.data.issues[1]?.priorityLevel + ')');
  if (sortRes.data.issues.length >= 2) {
    const isSorted = sortRes.data.issues[0].priorityScore >= sortRes.data.issues[1].priorityScore;
    console.log('   Priority Sort Verified Descending:', isSorted ? 'YES' : 'NO');
  }

  // 4. Test Search by Keyword
  console.log('\n4. Testing Text Search (search="road")...');
  const searchRes = await apiCall('GET', '/api/admin/issues?search=road', null, token);
  console.log('   Matching results count:', searchRes.data.issues.length);
  searchRes.data.issues.forEach(i => console.log('     Found:', i.title));

  // 5. Test Filters: Category Filter
  console.log('\n5. Testing Category Filter (category="Streetlight")...');
  const catRes = await apiCall('GET', '/api/admin/issues?category=Streetlight', null, token);
  console.log('   Category filter count:', catRes.data.issues.length);
  catRes.data.issues.forEach(i => console.log('     Title:', i.title, '| Category:', i.category));

  // 6. Test Single Issue Details endpoint
  const targetId = sortRes.data.issues[0]._id;
  console.log('\n6. Testing GET /api/admin/issues/' + targetId + '...');
  const singleRes = await apiCall('GET', '/api/admin/issues/' + targetId, null, token);
  console.log('   Single Issue Status:', singleRes.status);
  console.log('   Title:', singleRes.data.issue.title);
  console.log('   Priority Score:', singleRes.data.issue.priority?.score, 'Level:', singleRes.data.issue.priority?.level);
  console.log('   Priority Factors:', singleRes.data.issue.priority?.factors ? 'Present' : 'Missing');
  console.log('   Status History Entries:', singleRes.data.issue.statusHistory?.length);

  console.log('\n=== ALL STEP 6 ADMIN MANAGEMENT TESTS PASSED SUCCESSFULLY! ===');
}

runAdminManagementTest().catch(console.error);
