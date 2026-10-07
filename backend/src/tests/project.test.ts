import { createApp } from '../app';
import { closePool } from '../config/database';
import { AuthService } from '../services/auth.service';
import { Server } from 'http';

async function runTests() {
  const app = createApp();
  const PORT = 5099;
  let server: Server;

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`🧪 Test server started on port ${PORT}`);
      resolve();
    });
  });

  const BASE_URL = `http://localhost:${PORT}`;

  try {
    console.log('\n--- 1. Setting up Test Users ---');
    const userAEmail = `user_a_${Date.now()}@test.com`;
    const userBEmail = `user_b_${Date.now()}@test.com`;

    const userARes = await AuthService.register({
      fullName: 'User A',
      email: userAEmail,
      password: 'password123',
    });
    const tokenA = userARes.token;
    console.log('✅ User A registered and token acquired');

    const userBRes = await AuthService.register({
      fullName: 'User B',
      email: userBEmail,
      password: 'password123',
    });
    const tokenB = userBRes.token;
    console.log('✅ User B registered and token acquired');

    console.log('\n--- 2. Create Project (User A) ---');
    const createRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Alpha Project',
        description: 'First project for testing',
        status: 'IN_PROGRESS',
        startDate: new Date().toISOString(),
      }),
    });
    const createData = (await createRes.json()) as any;
    console.log('Status:', createRes.status);
    console.log('Response:', createData);
    if (createRes.status !== 201) throw new Error('Create project failed');
    const projectId = createData.data.project.id;
    console.log('✅ Project created with ID:', projectId);

    console.log('\n--- 3. Create Second Project for Filtering (User A) ---');
    await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Beta Project',
        status: 'COMPLETED',
      }),
    });
    console.log('✅ Second project created');

    console.log('\n--- 4. List All Projects (User A) ---');
    const listRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = (await listRes.json()) as any;
    console.log('Count:', listData.results);
    if (listData.results < 2) throw new Error('Expected at least 2 projects');
    console.log('✅ Listed projects successfully');

    console.log('\n--- 5. Get Project by ID (User A) ---');
    const getRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const getData = (await getRes.json()) as any;
    console.log('Status:', getRes.status, 'Project Name:', getData.data.project.name);
    if (getRes.status !== 200 || getData.data.project.id !== projectId) {
      throw new Error('Get project by ID failed');
    }
    console.log('✅ Fetched project by ID successfully');

    console.log('\n--- 6. Update Project (User A) ---');
    const updateRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'Alpha Project Renamed',
        status: 'COMPLETED',
      }),
    });
    const updateData = (await updateRes.json()) as any;
    console.log('Updated Status:', updateRes.status, 'New Name:', updateData.data.project.name);
    if (updateData.data.project.name !== 'Alpha Project Renamed') {
      throw new Error('Update project failed');
    }
    console.log('✅ Updated project successfully');

    console.log('\n--- 7. Search Projects by Name ---');
    const searchRes = await fetch(`${BASE_URL}/api/projects?search=Renamed`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const searchData = (await searchRes.json()) as any;
    console.log('Search matches:', searchData.results);
    if (searchData.results !== 1) throw new Error('Search failed');
    console.log('✅ Search projects verified');

    console.log('\n--- 8. Filter Projects by Status ---');
    const filterRes = await fetch(`${BASE_URL}/api/projects?status=COMPLETED`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const filterData = (await filterRes.json()) as any;
    console.log('Status filter matches:', filterData.results);
    if (filterData.results < 2) throw new Error('Status filter failed');
    console.log('✅ Filter by status verified');

    console.log('\n--- 9. Cross-User Ownership Protection (User B cannot access User A project) ---');
    const crossGetRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('User B GET User A project status:', crossGetRes.status);
    if (crossGetRes.status !== 404) {
      throw new Error('Security violation: User B accessed User A project');
    }
    console.log('✅ Cross-user read correctly denied (404)');

    const crossUpdateRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ name: 'Hacked by User B' }),
    });
    console.log('User B PUT User A project status:', crossUpdateRes.status);
    if (crossUpdateRes.status !== 404) {
      throw new Error('Security violation: User B modified User A project');
    }
    console.log('✅ Cross-user update correctly denied (404)');

    const crossDeleteRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('User B DELETE User A project status:', crossDeleteRes.status);
    if (crossDeleteRes.status !== 404) {
      throw new Error('Security violation: User B deleted User A project');
    }
    console.log('✅ Cross-user delete correctly denied (404)');

    console.log('\n--- 10. Unauthorized Access (No Token / Invalid Token) ---');
    const noTokenRes = await fetch(`${BASE_URL}/api/projects`);
    console.log('No token status:', noTokenRes.status);
    if (noTokenRes.status !== 401) throw new Error('Expected 401 for no token');

    const badTokenRes = await fetch(`${BASE_URL}/api/projects`, {
      headers: { Authorization: 'Bearer invalid.token.value' },
    });
    console.log('Invalid token status:', badTokenRes.status);
    if (badTokenRes.status !== 401) throw new Error('Expected 401 for invalid token');
    console.log('✅ Unauthorized access checks verified');

    console.log('\n--- 11. Invalid Input Validation ---');
    const invalidInputRes = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: '', // Empty name violates min(1)
        status: 'INVALID_STATUS',
      }),
    });
    console.log('Invalid input status:', invalidInputRes.status);
    const invalidData = (await invalidInputRes.json()) as any;
    console.log('Validation errors:', invalidData.errors);
    if (invalidInputRes.status !== 400) throw new Error('Expected 400 for invalid input');
    console.log('✅ Zod validation rejection verified');

    console.log('\n--- 12. Delete Project (User A) ---');
    const deleteRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('Delete status:', deleteRes.status);
    if (deleteRes.status !== 200) throw new Error('Delete project failed');

    // Confirm it is deleted
    const verifyDeleteRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('Post-delete GET status:', verifyDeleteRes.status);
    if (verifyDeleteRes.status !== 404) throw new Error('Project should no longer exist');
    console.log('✅ Delete verified successfully');

    console.log('\n🎉 ALL 10 TEST SCENARIOS PASSED WITH FULL ISOLATION & COMPLIANCE!');
  } finally {
    server!.close();
    await closePool();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
