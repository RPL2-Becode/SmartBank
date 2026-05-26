const { after, test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

process.env.JWT_SECRET = 'test-secret';

const db = require('../config/db');
const authController = require('../controllers/authController');
const bankController = require('../controllers/bankController');
const gatewayController = require('../controllers/gatewayController');
const { requireRoles } = require('../middlewares/authMiddleware');
const {
    validateMoneyAmount,
    validateRegister,
    validatePayment
} = require('../middlewares/validationMiddleware');

after(async () => {
    if (typeof db.end === 'function') {
        await db.end();
    }
});

function createRes() {
    return {
        statusCode: 200,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        }
    };
}

function runMiddleware(middleware, body) {
    const req = { body };
    const res = createRes();
    let nextCalled = false;
    middleware(req, res, () => {
        nextCalled = true;
    });
    return { req, res, nextCalled };
}

test('register returns token and frontend role', async () => {
    const queries = [];
    db.query = async (sql, params) => {
        queries.push({ sql, params });
        if (sql.includes('SELECT * FROM users')) return [[]];
        if (sql.includes('SELECT SUM(balance)')) return [[{ totalMoney: 0 }]];
        if (sql.includes('INSERT INTO users')) return [{ insertId: 1 }];
        return [[]];
    };

    const req = {
        validatedData: {
            userId: 'user_1',
            name: 'User One',
            password: 'Password123',
            role: 'TELLER'
        }
    };
    const res = createRes();

    await authController.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.payload.token);
    assert.equal(res.payload.data.role, 'teller');
    assert.equal(queries.at(-1).params[3], 'TELLER');
});

test('login maps backend roles to frontend roles', async () => {
    for (const [backendRole, frontendRole] of [
        ['NASABAH', 'nasabah'],
        ['ADMIN', 'admin'],
        ['TELLER', 'teller'],
        ['MANAGER', 'manager']
    ]) {
        const hashedPassword = await bcrypt.hash('Password123', 4);
        db.query = async () => [[{
            id: 1,
            userId: `user_${backendRole}`,
            name: backendRole,
            password: hashedPassword,
            role: backendRole,
            tier: 'REGULER',
            balance: 50000
        }]];

        const req = { validatedData: { userId: `user_${backendRole}`, password: 'Password123' } };
        const res = createRes();

        await authController.login(req, res);

        assert.equal(res.statusCode, 200);
        assert.ok(res.payload.token);
        assert.equal(res.payload.data.role, frontendRole);
    }
});

test('ledger role middleware denies NASABAH and allows staff roles', () => {
    const middleware = requireRoles('ADMIN', 'TELLER', 'MANAGER');

    const deniedReq = { user: { role: 'NASABAH' } };
    const deniedRes = createRes();
    middleware(deniedReq, deniedRes, () => assert.fail('NASABAH must not access ledger'));
    assert.equal(deniedRes.statusCode, 403);

    for (const role of ['ADMIN', 'TELLER', 'MANAGER']) {
        let nextCalled = false;
        middleware({ user: { role } }, createRes(), () => {
            nextCalled = true;
        });
        assert.equal(nextCalled, true);
    }
});

test('strict amount validation rejects string, zero, negative, and non-finite values', () => {
    assert.match(validateMoneyAmount('100'), /number/);
    assert.match(validateMoneyAmount(0), /lebih besar/);
    assert.match(validateMoneyAmount(-1), /lebih besar/);
    assert.match(validateMoneyAmount(Number.POSITIVE_INFINITY), /number/);
    assert.equal(validateMoneyAmount(100), null);

    for (const amount of ['100', 0, -1]) {
        const result = runMiddleware(validatePayment, { toUserId: 'receiver', amount });
        assert.equal(result.nextCalled, false);
        assert.equal(result.res.statusCode, 400);
    }
});

test('register validation rejects long userId and short password', () => {
    const longUserId = 'a'.repeat(51);
    const longUser = runMiddleware(validateRegister, {
        userId: longUserId,
        name: 'User One',
        password: 'Password123',
        role: 'nasabah'
    });
    assert.equal(longUser.res.statusCode, 400);

    const shortPassword = runMiddleware(validateRegister, {
        userId: 'user_1',
        name: 'User One',
        password: 'short',
        role: 'nasabah'
    });
    assert.equal(shortPassword.res.statusCode, 400);
});

test('normal payment ignores body fromUserId and debits authenticated user', async () => {
    const calls = [];
    const connection = {
        query: async (sql, params = []) => {
            calls.push({ sql, params });
            if (sql.includes('COUNT(*)')) return [[{ total: 0 }]];
            if (sql.includes('ORDER BY created_at')) return [[]];
            if (sql.includes('system_rates')) return [[]];
            if (sql.includes('SELECT balance FROM users')) {
                return [[{ balance: 1000000 }]];
            }
            if (sql.includes('INSERT INTO transactions')) return [{ insertId: 123 }];
            return [{}];
        },
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {}
    };
    db.getConnection = async () => connection;

    const req = {
        user: { userId: 'real_user' },
        body: { fromUserId: 'attacker', toUserId: 'merchant', amount: 100 },
        validatedData: { toUserId: 'merchant', amount: 100, type: 'PAYMENT_POS' }
    };
    const res = createRes();

    await bankController.payment(req, res);

    assert.equal(res.statusCode, 200);
    const debitCall = calls.find((call) => call.sql.includes('UPDATE users SET balance = balance -'));
    assert.equal(debitCall.params[1], 'real_user');
    assert.equal(calls.some((call) => call.params.includes('attacker')), false);
});

test('duplicate gateway idempotency key returns existing request without insert', async () => {
    const calls = [];
    db.query = async (sql, params = []) => {
        calls.push({ sql, params });
        if (sql.includes('SELECT * FROM payment_requests WHERE idempotencyKey')) {
            return [[{
                requestId: 'REQ-1',
                sourceApp: 'POS',
                fromUserId: 'payer',
                toUserId: 'merchant',
                amount: '100.00',
                type: 'PAYMENT_POS',
                status: 'SUCCESS',
                idempotencyKey: 'idem-1',
                metadata: '{}'
            }]];
        }
        return [{}];
    };

    const req = {
        method: 'POST',
        originalUrl: '/smartbank/gateway/payment-requests',
        params: {},
        body: { requestId: 'REQ-2', sourceApp: 'POS', idempotencyKey: 'idem-1' },
        validatedData: {
            requestId: 'REQ-2',
            sourceApp: 'POS',
            fromUserId: 'payer',
            toUserId: 'merchant',
            amount: 100,
            type: 'PAYMENT_POS',
            idempotencyKey: 'idem-1',
            metadata: {}
        }
    };
    const res = createRes();

    await gatewayController.createPaymentRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.data.requestId, 'REQ-1');
    assert.equal(calls.some((call) => call.sql.includes('INSERT INTO payment_requests')), false);
});
