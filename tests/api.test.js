/**
 * Integration Tests — Finance Backend
 * Run: npm test
 *
 * Requires: a running MySQL instance + .env configured
 * (or use a separate test DB configured via DB_NAME_TEST)
 */

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

// ─── Shared state across tests ────────────────────────────────────────────────
let adminToken, analystToken, viewerToken;
let createdRecordId;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const loginAs = async (email, password) => {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password });
  return res.body.data?.accessToken;
};

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  // Seed test users if they don't exist
  await pool.query(`
    INSERT IGNORE INTO users (name, email, password_hash, role_id, status) VALUES
      ('Test Analyst', 'analyst@test.dev', '$2b$10$YJK3g2E0PiRx1.fq3oDCz.Wg0GTPYt7FoNk.LzMQVh8iL0dT9qzPy', 2, 'active'),
      ('Test Viewer',  'viewer@test.dev',  '$2b$10$YJK3g2E0PiRx1.fq3oDCz.Wg0GTPYt7FoNk.LzMQVh8iL0dT9qzPy', 1, 'active')
  `);
  adminToken   = await loginAs('admin@finance.dev', 'Admin@1234');
  analystToken = await loginAs('analyst@test.dev',  'Admin@1234');
  viewerToken  = await loginAs('viewer@test.dev',   'Admin@1234');
});

afterAll(async () => {
  await pool.end();
});

// ─── AUTH TESTS ───────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/login', () => {
  it('returns 200 and tokens for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@finance.dev', password: 'Admin@1234' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@finance.dev', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 422 for missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'Admin@1234' });
    expect(res.statusCode).toBe(422);
  });
});

// ─── RECORD TESTS ─────────────────────────────────────────────────────────────
describe('Financial Records API', () => {
  it('Admin can create a record', async () => {
    const res = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'Salary',
        record_date: '2025-01-15',
        notes: 'January salary',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    createdRecordId = res.body.data.id;
  });

  it('Viewer cannot create a record', async () => {
    const res = await request(app)
      .post('/api/v1/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'expense', category: 'Food', record_date: '2025-01-20' });
    expect(res.statusCode).toBe(403);
  });

  it('Viewer can read all records', async () => {
    const res = await request(app)
      .get('/api/v1/records')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('pagination');
  });

  it('Admin can update a record', async () => {
    const res = await request(app)
      .put(`/api/v1/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Updated notes' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.notes).toBe('Updated notes');
  });

  it('Analyst cannot delete a record', async () => {
    const res = await request(app)
      .delete(`/api/v1/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('Admin can delete a record', async () => {
    const res = await request(app)
      .delete(`/api/v1/records/${createdRecordId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ─── DASHBOARD TESTS ──────────────────────────────────────────────────────────
describe('Dashboard API', () => {
  it('Viewer can access overview', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/overview')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('net_balance');
  });

  it('Viewer cannot access category analytics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/categories')
      .set('Authorization', `Bearer ${viewerToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('Analyst can access monthly trends', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/trends/monthly?year=2025')
      .set('Authorization', `Bearer ${analystToken}`);
    expect(res.statusCode).toBe(200);
  });
});

// ─── UNAUTHENTICATED TESTS ────────────────────────────────────────────────────
describe('Protected routes reject unauthenticated requests', () => {
  it('GET /records returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/records');
    expect(res.statusCode).toBe(401);
  });

  it('GET /dashboard/overview returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/dashboard/overview');
    expect(res.statusCode).toBe(401);
  });
});
