// tests/bank.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let tokenA, tokenB, tokenAdmin;
const userA = 'bank_test_userA';
const userB = 'bank_test_userB';
const adminUser = 'bank_test_admin';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cleanupUsers = async () => {
  const users = [userA, userB, adminUser];
  const placeholders = users.map(() => '?').join(',');
  await db.query(`DELETE FROM fee_collections WHERE transaction_id IN (SELECT id FROM transactions WHERE fromUserId IN (${placeholders}) OR toUserId IN (${placeholders}))`, [...users, ...users]);
  await db.query(`DELETE FROM tax_collections WHERE transaction_id IN (SELECT id FROM transactions WHERE fromUserId IN (${placeholders}) OR toUserId IN (${placeholders}))`, [...users, ...users]);
  await db.query(`DELETE FROM transactions WHERE fromUserId IN (${placeholders}) OR toUserId IN (${placeholders})`, [...users, ...users]);
  await db.query(`DELETE FROM loan_installments WHERE loan_id IN (SELECT id FROM loans WHERE userId IN (${placeholders}))`, users);
  await db.query(`DELETE FROM loans WHERE userId IN (${placeholders})`, users);
  await db.query(`DELETE FROM gateway_payments WHERE userId IN (${placeholders})`, users);
  await db.query(`DELETE FROM users WHERE userId IN (${placeholders})`, users);
};

beforeAll(async () => {
  await cleanupUsers();

  const hashedPassword = await bcrypt.hash('password123', 10);
  await db.query(
    'INSERT INTO users (userId, name, password, role, tier, balance) VALUES (?, ?, ?, ?, ?, ?)',
    [userA, 'User A', hashedPassword, 'NASABAH', 'REGULER', 100000]
  );
  await db.query(
    'INSERT INTO users (userId, name, password, role, tier, balance) VALUES (?, ?, ?, ?, ?, ?)',
    [userB, 'User B', hashedPassword, 'NASABAH', 'REGULER', 100000]
  );
  await db.query(
    'INSERT INTO users (userId, name, password, role, tier, balance) VALUES (?, ?, ?, ?, ?, ?)',
    [adminUser, 'Admin Test', hashedPassword, 'ADMIN', 'REGULER', 200000]
  );

  const secret = process.env.JWT_SECRET;
  tokenA = jwt.sign({ id: 1, userId: userA, role: 'NASABAH', tier: 'REGULER' }, secret, { expiresIn: '1d' });
  tokenB = jwt.sign({ id: 2, userId: userB, role: 'NASABAH', tier: 'REGULER' }, secret, { expiresIn: '1d' });
  tokenAdmin = jwt.sign({ id: 3, userId: adminUser, role: 'ADMIN', tier: 'REGULER' }, secret, { expiresIn: '1d' });
});

afterAll(async () => {
  await cleanupUsers();
});

// ─── Transfer API ────────────────────────────────────────────────────────────

describe('Transfer API', () => {
  it('should transfer successfully with valid data', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB, amount: 5000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.refId).toBeDefined();
    expect(res.body.data.amount).toBe(5000);
  });

  it('should reject transfer to self', async () => {
    await sleep(11000); // wait out cooldown
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userA, amount: 1000 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('diri sendiri');
  }, 20000);

  it('should reject transfer to non-existent user', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: 'nonexistent_user_xyz', amount: 1000 });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain('User tidak ditemukan');
  });

  it('should reject transfer with insufficient balance', async () => {
    await sleep(11000); // wait out cooldown
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB, amount: 9999999 });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Saldo tidak mencukupi');
  }, 20000);

  it('should reject transfer with invalid amount (zero)', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB, amount: 0 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject transfer with negative amount', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ toUserId: userB, amount: -5000 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject transfer without toUserId', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 1000 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject transfer without auth token', async () => {
    const res = await request(app)
      .post('/smartbank/transfer')
      .send({ toUserId: userB, amount: 1000 });

    expect(res.statusCode).toBe(403);
  });
});

// ─── Payment API ─────────────────────────────────────────────────────────────

describe('Payment API', () => {
  it('should process payment with valid type', async () => {
    await sleep(11000); // wait out cooldown
    const res = await request(app)
      .post('/smartbank/payment')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ toUserId: userB, amount: 5000, type: 'PAYMENT_MARKETPLACE', description: 'Test payment' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.refId).toBeDefined();
  }, 20000);

  it('should reject payment with invalid type', async () => {
    const res = await request(app)
      .post('/smartbank/payment')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ toUserId: userB, amount: 5000, type: 'INVALID_TYPE' });

    expect(res.statusCode).toBe(400);
  });

  it('should reject payment to self', async () => {
    const res = await request(app)
      .post('/smartbank/payment')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ toUserId: adminUser, amount: 5000, type: 'PAYMENT_POS' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('diri sendiri');
  });
});

// ─── Loan API ────────────────────────────────────────────────────────────────

describe('Loan API', () => {
  it('should approve loan with valid amount', async () => {
    await sleep(11000); // wait out cooldown from payment tests
    const res = await request(app)
      .post('/smartbank/loan')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 50000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.amount).toBe(50000);
    expect(res.body.data.totalDue).toBe(55000); // 50000 + 10% interest
  }, 20000);

  it('should reject loan exceeding limit (100K)', async () => {
    const res = await request(app)
      .post('/smartbank/loan')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 150000 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject loan with zero amount', async () => {
    const res = await request(app)
      .post('/smartbank/loan')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 0 });

    expect(res.statusCode).toBe(400);
  });

  it('should reject loan with negative amount', async () => {
    const res = await request(app)
      .post('/smartbank/loan')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: -10000 });

    expect(res.statusCode).toBe(400);
  });
});

// ─── Simulated Payment Gateway ───────────────────────────────────────────────

describe('Simulated Payment Gateway', () => {
  let testOrderId;

  it('should create a TOPUP payment intent', async () => {
    const res = await request(app)
      .post('/smartbank/gateway/create')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 25000, type: 'TOPUP' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.orderId).toBeDefined();
    expect(res.body.data.status).toBe('PENDING');
    testOrderId = res.body.data.orderId;
  });

  it('should get payment status as PENDING', async () => {
    const res = await request(app)
      .get(`/smartbank/gateway/status/${testOrderId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('should approve payment via callback', async () => {
    const res = await request(app)
      .post('/smartbank/gateway/callback')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ orderId: testOrderId, action: 'approve' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('SETTLED');
  });

  it('should reject double-processing of same payment', async () => {
    const res = await request(app)
      .post('/smartbank/gateway/callback')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ orderId: testOrderId, action: 'approve' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('sudah diproses');
  });

  it('should reject callback for non-existent order', async () => {
    const res = await request(app)
      .post('/smartbank/gateway/callback')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ orderId: 'GW-NONEXISTENT', action: 'approve' });

    expect(res.statusCode).toBe(404);
  });

  it('should create and reject a payment', async () => {
    const createRes = await request(app)
      .post('/smartbank/gateway/create')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ amount: 10000, type: 'WITHDRAWAL' });

    expect(createRes.statusCode).toBe(201);
    const rejectOrderId = createRes.body.data.orderId;

    const callbackRes = await request(app)
      .post('/smartbank/gateway/callback')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ orderId: rejectOrderId, action: 'reject' });

    expect(callbackRes.statusCode).toBe(200);
    expect(callbackRes.body.data.status).toBe('FAILED');
  });

  it('should get gateway logs (admin only)', async () => {
    const res = await request(app)
      .get('/smartbank/gateway/logs')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.payments).toBeDefined();
    expect(Array.isArray(res.body.data.payments)).toBe(true);
  });

  it('should deny gateway logs for non-admin', async () => {
    const res = await request(app)
      .get('/smartbank/gateway/logs')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(403);
  });
});

// ─── Balance & Ledger API ────────────────────────────────────────────────────

describe('Balance API', () => {
  it('should return user balance and history', async () => {
    const res = await request(app)
      .get('/smartbank/balance')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.balance).toBeDefined();
    expect(Array.isArray(res.body.data.history)).toBe(true);
  });
});

describe('Ledger API', () => {
  it('should return ledger for admin', async () => {
    const res = await request(app)
      .get('/smartbank/ledger')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should deny ledger for regular user', async () => {
    const res = await request(app)
      .get('/smartbank/ledger')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(403);
  });
});
