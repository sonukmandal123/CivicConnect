const http = require('http');

function get(path) {
  return new Promise(resolve => {
    http.get('http://localhost:5173' + path, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ path, status: res.statusCode, body }));
    });
  });
}

async function run() {
  const main = await get('/src/main.jsx');
  console.log('main.jsx status:', main.status);
  
  const app = await get('/src/App.jsx');
  console.log('App.jsx status:', app.status);

  // Check all imported pages
  const pages = [
    '/src/context/AuthContext.jsx',
    '/src/pages/Login.jsx',
    '/src/pages/Register.jsx',
    '/src/pages/ReportIssue.jsx',
    '/src/pages/Dashboard.jsx',
    '/src/pages/AdminDashboard.jsx',
    '/src/pages/AdminAnalytics.jsx',
    '/src/pages/AdminIssueDetails.jsx',
    '/src/pages/Home.jsx',
    '/src/pages/MapPage.jsx',
    '/src/pages/IssueDetails.jsx',
    '/src/components/IssueCard.jsx',
    '/src/components/PriorityBadge.jsx',
    '/src/components/StatusBadge.jsx',
    '/src/components/StatusTimeline.jsx',
    '/src/components/maps/IssueMap.jsx',
    '/src/components/modals/ActionModal.jsx'
  ];

  for (const p of pages) {
    const res = await get(p);
    console.log(p.padEnd(35), res.status, res.status !== 200 ? res.body.substring(0, 100) : 'OK');
  }
}

run();
