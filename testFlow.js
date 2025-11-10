// Quick integration test script (run: node testFlow.js)
// Uses direct HTTP calls with fetch (Node 18+/22 global)
// Verifies: registration always Viewer, request editor, admin approve.

const base = 'http://localhost:5000/api';

async function main() {
  function log(step, data) { console.log(`\n== ${step} ==`); console.dir(data, { depth: 4 }); }

  // 1. Register new user attempting to escalate role
  const unique = Date.now();
  const registerBody = { username: `test${unique}`, email: `test${unique}@example.com`, password: 'password123', role: 'Admin' };
  const regRes = await fetch(`${base}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerBody) });
  const regJson = await regRes.json();
  log('Register Response', regJson);
  if (regJson.user?.role !== 'Viewer') throw new Error('Role is not Viewer after registration');
  const viewerToken = regJson.token;

  // 2. Request editor access
  const reqRes = await fetch(`${base}/users/request-editor`, { method: 'POST', headers: { 'Authorization': `Bearer ${viewerToken}`, 'Content-Type': 'application/json' } });
  const reqJson = await reqRes.json();
  log('Editor Request Response', reqJson);

  // 3. Admin login
  const adminLoginBody = { email: 'admin@example.com', password: 'admin123' };
  const adminRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(adminLoginBody) });
  const adminJson = await adminRes.json();
  log('Admin Login Response', adminJson);
  const adminToken = adminJson.token;
  if (!adminToken) throw new Error('Admin login failed (missing token)');

  // 4. List editor requests
  const listRes = await fetch(`${base}/users/editor-requests`, { headers: { 'Authorization': `Bearer ${adminToken}` } });
  const listJson = await listRes.json();
  log('Pending Requests', listJson);
  const target = listJson.find(u => u.email === registerBody.email);
  if (!target) throw new Error('Viewer request not found in pending list');

  // 5. Approve request
  const approveRes = await fetch(`${base}/users/editor-requests/${target._id}/approve`, { method: 'POST', headers: { 'Authorization': `Bearer ${adminToken}` } });
  const approveJson = await approveRes.json();
  log('Approve Response', approveJson);

  // 6. Login again as viewer to see new role
  const viewerLoginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: registerBody.email, password: registerBody.password }) });
  const viewerLoginJson = await viewerLoginRes.json();
  log('Viewer Re-Login Response', viewerLoginJson);
  if (viewerLoginJson.user?.role !== 'Editor') throw new Error('Viewer role did not update to Editor after approval');

  console.log('\nAll integration test steps passed.');
}

main().catch(err => { console.error('Test flow failed:', err); process.exit(1); });
