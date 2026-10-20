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

async function runGeospatialTest() {
  console.log('====================================================');
  console.log('   Step 10: Geospatial Improvements & Nearby Query ');
  console.log('====================================================\n');

  // Test 1: Validation - Missing coordinates
  console.log('1. Testing validation: Missing coordinates...');
  const missingRes = await apiCall('GET', '/api/issues/nearby');
  console.log(`   HTTP Status: ${missingRes.status} (Expected 400)`);
  console.log(`   Error Message: "${missingRes.data.message}"`);
  if (missingRes.status !== 400) {
    throw new Error('Expected 400 when coordinates are missing');
  }
  console.log('   [PASS] Missing coordinates validation\n');

  // Test 2: Validation - Out of bounds coordinates
  console.log('2. Testing validation: Out-of-bounds latitude (latitude=120)...');
  const oobRes = await apiCall('GET', '/api/issues/nearby?longitude=86.2&latitude=120');
  console.log(`   HTTP Status: ${oobRes.status} (Expected 400)`);
  console.log(`   Error Message: "${oobRes.data.message}"`);
  if (oobRes.status !== 400) {
    throw new Error('Expected 400 for out-of-bounds coordinates');
  }
  console.log('   [PASS] Coordinate bounds validation\n');

  // Test 3: Standard Geospatial Query (Default 5000m radius around 86.2044, 22.8067)
  const testLng = 86.2044;
  const testLat = 22.8067;
  console.log(`3. Querying nearby issues around [lng: ${testLng}, lat: ${testLat}] (radius: 5000m / 5km)...`);
  const nearbyRes = await apiCall('GET', `/api/issues/nearby?longitude=${testLng}&latitude=${testLat}`);
  console.log(`   HTTP Status: ${nearbyRes.status}`);
  if (nearbyRes.status !== 200 || !nearbyRes.data.success) {
    throw new Error('Nearby query failed: ' + JSON.stringify(nearbyRes.data));
  }
  console.log(`   Count of issues within 5km: ${nearbyRes.data.count}`);
  console.log('   Results sorted by proximity (nearest to farthest):');
  nearbyRes.data.issues.forEach((iss, idx) => {
    console.log(`     ${idx + 1}. [${iss.distanceMeters}m / ${iss.distanceKm}km] ${iss.title}`);
    console.log(`        Category: ${iss.category} | Severity: ${iss.severity} | Status: ${iss.status}`);
    console.log(`        Priority: ${iss.priorityScore} (${iss.priorityLevel}) | Coordinates: [${iss.location?.coordinates?.join(', ')}]`);
  });

  // Verify distance ordering
  for (let i = 0; i < nearbyRes.data.issues.length - 1; i++) {
    const d1 = nearbyRes.data.issues[i].distanceMeters;
    const d2 = nearbyRes.data.issues[i + 1].distanceMeters;
    if (d1 > d2) {
      throw new Error(`Distance ordering failed: issue ${i} (${d1}m) is greater than issue ${i+1} (${d2}m)`);
    }
  }
  console.log('   [PASS] Proximity ordering verified mathematically\n');

  // Test 4: Narrow Radius Query (radius = 200m)
  console.log('4. Querying with tight radius (radius = 200m)...');
  const narrowRes = await apiCall('GET', `/api/issues/nearby?longitude=${testLng}&latitude=${testLat}&radius=200`);
  console.log(`   HTTP Status: ${narrowRes.status}`);
  console.log(`   Issues within 200m: ${narrowRes.data.count}`);
  narrowRes.data.issues.forEach(iss => {
    console.log(`     - [${iss.distanceMeters}m] ${iss.title} (${iss.category})`);
    if (iss.distanceMeters > 200) {
      throw new Error(`Issue ${iss.title} exceeds max radius: ${iss.distanceMeters}m > 200m`);
    }
  });
  console.log('   [PASS] Max radius clamping and boundary filtering\n');

  // Test 5: Category Filtering (category = Streetlight)
  console.log('5. Querying with category filter (category=Streetlight)...');
  const catRes = await apiCall('GET', `/api/issues/nearby?longitude=${testLng}&latitude=${testLat}&category=Streetlight`);
  console.log(`   HTTP Status: ${catRes.status}`);
  console.log(`   Matching Streetlight issues: ${catRes.data.count}`);
  catRes.data.issues.forEach(iss => {
    console.log(`     - ${iss.title} (Category: ${iss.category})`);
    if (iss.category !== 'Streetlight') {
      throw new Error(`Expected category Streetlight, got: ${iss.category}`);
    }
  });
  console.log('   [PASS] Category filter on spatial query\n');

  console.log('====================================================');
  console.log(' [PASS] Step 10 Geospatial Nearby Query Passed!     ');
  console.log('====================================================\n');
}

runGeospatialTest().catch(err => {
  console.error('\n[FAIL] Test failed with error:', err);
  process.exit(1);
});
