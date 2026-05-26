// Integration tests for P0 fixes — require a live MySQL database.
// If the DB is unreachable these tests will fail naturally; that is
// acknowledged in the PR body.

const request = require('supertest');
const app = require('../server');
const db = require('../config/db');

const TEST_PREFIX = 'p0_';

// Delete child rows before deleting users so the FK constraints on
// transactions / payment_requests / gateway_logs don't block cleanup.
async function purgeChildRowsForUser(userId) {
    if (!userId) return;
    const queries = [
        ['DELETE FROM gateway_logs WHERE requestId IN (SELECT requestId FROM payment_requests WHERE fromUserId = ? OR toUserId = ?)', [userId, userId]],
        ['DELETE FROM payment_requests WHERE fromUserId = ? OR toUserId = ?', [userId, userId]],
        ['DELETE FROM transactions WHERE fromUserId = ? OR toUserId = ?', [userId, userId]],
        ['DELETE FROM loan_installments WHERE loan_id IN (SELECT id FROM loans WHERE userId = ?)', [userId]],
        ['DELETE FROM loans WHERE userId = ?', [userId]],
    ];
    for (const [sql, params] of queries) {
        try { await db.query(sql, params); } catch (_) { /* ignore */ }
    }
}

async function purgeChildRowsForPrefix(prefix) {
    const queries = [
        ['DELETE FROM gateway_logs WHERE requestId IN (SELECT requestId FROM payment_requests WHERE fromUserId LIKE ? OR toUserId LIKE ?)', [`${prefix}%`, `${prefix}%`]],
        ['DELETE FROM payment_requests WHERE fromUserId LIKE ? OR toUserId LIKE ?', [`${prefix}%`, `${prefix}%`]],
        ['DELETE FROM transactions WHERE fromUserId LIKE ? OR toUserId LIKE ?', [`${prefix}%`, `${prefix}%`]],
        ['DELETE FROM loan_installments WHERE loan_id IN (SELECT id FROM loans WHERE userId LIKE ?)', [`${prefix}%`]],
        ['DELETE FROM loans WHERE userId LIKE ?', [`${prefix}%`]],
        ['DELETE FROM users WHERE userId LIKE ?', [`${prefix}%`]],
    ];
    for (const [sql, params] of queries) {
        try { await db.query(sql, params); } catch (_) { /* ignore */ }
    }
}

// Helper to register & log in, returning { token, user, userId }.
async function registerAndLogin(role, suffix = '') {
    const userId = `${TEST_PREFIX}${role.toLowerCase()}${suffix}`.slice(0, 50);
    await purgeChildRowsForUser(userId);
    await db.query('DELETE FROM users WHERE userId = ?', [userId]).catch(() => {});
    const reg = await request(app)
        .post('/smartbank/auth/register')
        .send({ userId, name: `P0 ${role}`, password: 'password123', role });
    if (reg.statusCode !== 201) {
        throw new Error(`register ${role} failed: ${reg.statusCode} ${JSON.stringify(reg.body)}`);
    }
    return { token: reg.body.token, user: reg.body.user, userId };
}

// Skip DB-dependent suites cleanly when the pool refuses connections.
let dbAvailable = true;
beforeAll(async () => {
    try {
        await db.query('SELECT 1');
    } catch {
        dbAvailable = false;
    }
});

const dbDescribe = (name, fn) => describe(name, () => {
    if (!dbAvailable) {
        // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
        it.skip(`(skipped — MySQL unavailable in this environment)`, () => {});
        return;
    }
    fn();
});

// ============================================================
// Role mapping (frontend lowercase round-trip)
// ============================================================

dbDescribe('P0 — register returns frontend role for each backend role', () => {
    afterAll(async () => {
        await purgeChildRowsForPrefix(TEST_PREFIX);
    });

    test.each([
        ['NASABAH', 'nasabah'],
        ['ADMIN', 'admin'],
        ['TELLER', 'teller'],
        ['MANAGER', 'manager'],
    ])('register role %s -> frontend role %s', async (backend, frontend) => {
        const { user, token, userId } = await registerAndLogin(backend, '_reg');
        expect(token).toBeDefined();
        expect(user.role).toBe(frontend);
        // sanity: cleanup
        await purgeChildRowsForUser(userId);
        await db.query('DELETE FROM users WHERE userId = ?', [userId]).catch(() => {});
    });
});

dbDescribe('P0 — login maps DB role to frontend role correctly', () => {
    test.each([
        ['NASABAH', 'nasabah'],
        ['ADMIN', 'admin'],
        ['TELLER', 'teller'],
        ['MANAGER', 'manager'],
    ])('login from %s row -> frontend role %s', async (backend, frontend) => {
        const userId = `${TEST_PREFIX}lg_${backend.toLowerCase()}`.slice(0, 50);
        await purgeChildRowsForUser(userId);
        await db.query('DELETE FROM users WHERE userId = ?', [userId]).catch(() => {});
        await request(app)
            .post('/smartbank/auth/register')
            .send({ userId, name: backend, password: 'password123', role: backend });

        const res = await request(app)
            .post('/smartbank/auth/login')
            .send({ userId, password: 'password123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.user.role).toBe(frontend);

        await purgeChildRowsForUser(userId);
        await db.query('DELETE FROM users WHERE userId = ?', [userId]).catch(() => {});
    });
});

// ============================================================
// Ledger access by role (NASABAH must NOT access)
// ============================================================

dbDescribe('P0 — ledger access matrix', () => {
    let nasabahToken;
    let adminToken;
    let tellerToken;
    let managerToken;

    beforeAll(async () => {
        nasabahToken = (await registerAndLogin('NASABAH', '_led')).token;
        adminToken = (await registerAndLogin('ADMIN', '_led')).token;
        tellerToken = (await registerAndLogin('TELLER', '_led')).token;
        managerToken = (await registerAndLogin('MANAGER', '_led')).token;
    });

    afterAll(async () => {
        await purgeChildRowsForPrefix(`${TEST_PREFIX}`);
    });

    test('NASABAH cannot read /smartbank/ledger', async () => {
        const res = await request(app)
            .get('/smartbank/ledger')
            .set('Authorization', `Bearer ${nasabahToken}`);
        expect(res.statusCode).toBe(403);
    });

    test('ADMIN can read /smartbank/ledger', async () => {
        const res = await request(app)
            .get('/smartbank/ledger')
            .set('Authorization', `Bearer ${adminToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('TELLER can read /smartbank/ledger', async () => {
        const res = await request(app)
            .get('/smartbank/ledger')
            .set('Authorization', `Bearer ${tellerToken}`);
        expect(res.statusCode).toBe(200);
    });

    test('MANAGER can read /smartbank/ledger', async () => {
        const res = await request(app)
            .get('/smartbank/ledger')
            .set('Authorization', `Bearer ${managerToken}`);
        expect(res.statusCode).toBe(200);
    });
});

// ============================================================
// Payment impersonation prevention + amount validation
// ============================================================

dbDescribe('P0 — POST /payment hardening', () => {
    let attackerToken;
    let attackerId;
    let victimId;
    let receiverId;

    beforeAll(async () => {
        const a = await registerAndLogin('NASABAH', '_atk');
        attackerToken = a.token;
        attackerId = a.userId;

        const v = await registerAndLogin('NASABAH', '_vic');
        victimId = v.userId;

        const r = await registerAndLogin('NASABAH', '_rcv');
        receiverId = r.userId;

        // Top up the victim so we can detect any wrongful debit.
        await db.query('UPDATE users SET balance = 200000 WHERE userId = ?', [victimId]);
    });

    afterAll(async () => {
        await purgeChildRowsForPrefix(`${TEST_PREFIX}`);
    });

    test('attacker cannot debit the victim by spoofing fromUserId in body', async () => {
        const before = await db.query('SELECT balance FROM users WHERE userId = ?', [victimId]);
        const victimBalanceBefore = Number(before[0][0].balance);

        const res = await request(app)
            .post('/smartbank/payment')
            .set('Authorization', `Bearer ${attackerToken}`)
            .send({
                fromUserId: victimId, // attempt impersonation
                toUserId: receiverId,
                amount: 5000,
                type: 'PAYMENT',
            });

        // Either rejected (insufficient attacker balance) or accepted —
        // either way the victim's balance must NOT change.
        const after = await db.query('SELECT balance FROM users WHERE userId = ?', [victimId]);
        const victimBalanceAfter = Number(after[0][0].balance);
        expect(victimBalanceAfter).toBe(victimBalanceBefore);
        // Sanity: status code is 400 (insufficient attacker balance) or 200
        // (debit pulled from the attacker, not the victim).
        expect([200, 400]).toContain(res.statusCode);
    });

    test('payment with string amount is rejected', async () => {
        const res = await request(app)
            .post('/smartbank/payment')
            .set('Authorization', `Bearer ${attackerToken}`)
            .send({ toUserId: receiverId, amount: '5000', type: 'PAYMENT' });
        expect(res.statusCode).toBe(400);
    });

    test('payment with zero amount is rejected', async () => {
        const res = await request(app)
            .post('/smartbank/payment')
            .set('Authorization', `Bearer ${attackerToken}`)
            .send({ toUserId: receiverId, amount: 0, type: 'PAYMENT' });
        expect(res.statusCode).toBe(400);
    });

    test('payment with negative amount is rejected', async () => {
        const res = await request(app)
            .post('/smartbank/payment')
            .set('Authorization', `Bearer ${attackerToken}`)
            .send({ toUserId: receiverId, amount: -50, type: 'PAYMENT' });
        expect(res.statusCode).toBe(400);
    });

    test('payment with NaN amount is rejected', async () => {
        const res = await request(app)
            .post('/smartbank/payment')
            .set('Authorization', `Bearer ${attackerToken}`)
            .send({ toUserId: receiverId, amount: NaN, type: 'PAYMENT' });
        // JSON.stringify drops NaN to null, which our schema rejects.
        expect(res.statusCode).toBe(400);
    });

    // attackerId is used for cleanup; reference to silence lint
    // eslint-disable-next-line no-unused-expressions
    () => attackerId;
});

// ============================================================
// Register validation (DB column limits)
// ============================================================

dbDescribe('P0 — register validation tightened', () => {
    test('userId longer than 50 chars is rejected with 400', async () => {
        const res = await request(app)
            .post('/smartbank/auth/register')
            .send({
                userId: 'a'.repeat(51),
                name: 'X',
                password: 'password123',
            });
        expect(res.statusCode).toBe(400);
    });

    test('userId with bad characters is rejected with 400', async () => {
        const res = await request(app)
            .post('/smartbank/auth/register')
            .send({
                userId: 'bad userid!',
                name: 'X',
                password: 'password123',
            });
        expect(res.statusCode).toBe(400);
    });

    test('password shorter than 8 chars is rejected with 400', async () => {
        const res = await request(app)
            .post('/smartbank/auth/register')
            .send({
                userId: `${TEST_PREFIX}shortpw`,
                name: 'X',
                password: 'short7c',
            });
        expect(res.statusCode).toBe(400);
    });
});

// ============================================================
// Gateway: idempotency & lifecycle
// ============================================================

dbDescribe('P0 — gateway payment_requests idempotency', () => {
    let payerId;
    let receiverId;

    beforeAll(async () => {
        const p = await registerAndLogin('NASABAH', '_gw_p');
        payerId = p.userId;
        const r = await registerAndLogin('NASABAH', '_gw_r');
        receiverId = r.userId;
        await db.query('UPDATE users SET balance = 500000 WHERE userId = ?', [payerId]);
    });

    afterAll(async () => {
        await purgeChildRowsForPrefix(`${TEST_PREFIX}`);
    });

    test('duplicate idempotencyKey does not create a second row and does not double-debit', async () => {
        const idempotencyKey = `idem-${Date.now()}-${Math.random()}`;
        const payload = {
            fromUserId: payerId,
            toUserId: receiverId,
            amount: 7500,
            type: 'PAYMENT',
            sourceApp: 'p0-tests',
            idempotencyKey,
        };

        const first = await request(app)
            .post('/smartbank/gateway/payment-requests')
            .send(payload);
        expect(first.statusCode).toBe(201);
        const requestId = first.body.data.requestId;

        // Replay
        const replay = await request(app)
            .post('/smartbank/gateway/payment-requests')
            .send(payload);
        expect(replay.statusCode).toBe(200);
        expect(replay.body.data.requestId).toBe(requestId);

        // Process once -> SUCCESS
        const proc1 = await request(app)
            .post(`/smartbank/gateway/payment-requests/${requestId}/process`);
        expect(proc1.statusCode).toBe(200);
        expect(proc1.body.data.status).toBe('SUCCESS');

        // Snapshot balances
        const [[payer1]] = await db.query('SELECT balance FROM users WHERE userId = ?', [payerId]);
        const balanceAfterFirstProcess = Number(payer1.balance);

        // Process again -> should NOT debit twice (still SUCCESS)
        const proc2 = await request(app)
            .post(`/smartbank/gateway/payment-requests/${requestId}/process`);
        expect(proc2.statusCode).toBe(200);
        expect(proc2.body.data.status).toBe('SUCCESS');

        const [[payer2]] = await db.query('SELECT balance FROM users WHERE userId = ?', [payerId]);
        expect(Number(payer2.balance)).toBe(balanceAfterFirstProcess);

        // payment_requests table should still have a single row
        const [count] = await db.query(
            'SELECT COUNT(*) AS n FROM payment_requests WHERE idempotencyKey = ?',
            [idempotencyKey],
        );
        expect(Number(count[0].n)).toBe(1);
    });
});
