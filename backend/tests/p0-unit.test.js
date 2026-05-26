// Pure unit tests — no DB required.
// Covers:
//   - frontendToBackendRole / backendToFrontendRole mapping
//   - strict amount validation in validationMiddleware schemas
//   - register validation rules (userId regex/length, password length)

const {
    frontendToBackendRole,
    backendToFrontendRole,
} = require('../utils/roles');

const {
    registerSchema,
    transferSchema,
    paymentSchema,
    loanSchema,
    gatewayCreateSchema,
} = require('../middlewares/validationMiddleware');

describe('utils/roles — bidirectional role mapping', () => {
    test('frontend lowercase -> canonical backend uppercase', () => {
        expect(frontendToBackendRole('nasabah')).toBe('NASABAH');
        expect(frontendToBackendRole('admin')).toBe('ADMIN');
        expect(frontendToBackendRole('teller')).toBe('TELLER');
        expect(frontendToBackendRole('manager')).toBe('MANAGER');
    });

    test('backend uppercase passthrough', () => {
        expect(frontendToBackendRole('NASABAH')).toBe('NASABAH');
        expect(frontendToBackendRole('ADMIN')).toBe('ADMIN');
        expect(frontendToBackendRole('TELLER')).toBe('TELLER');
        expect(frontendToBackendRole('MANAGER')).toBe('MANAGER');
    });

    test('legacy aliases collapse to a backend role', () => {
        expect(frontendToBackendRole('user')).toBe('NASABAH');
        expect(frontendToBackendRole('developer')).toBe('ADMIN');
        expect(frontendToBackendRole('insight_readonly')).toBe('NASABAH');
    });

    test('unknown / falsy values fall back to NASABAH', () => {
        expect(frontendToBackendRole(undefined)).toBe('NASABAH');
        expect(frontendToBackendRole(null)).toBe('NASABAH');
        expect(frontendToBackendRole('')).toBe('NASABAH');
        expect(frontendToBackendRole('something_else')).toBe('NASABAH');
    });

    test('backend -> frontend mapping is exhaustive and lowercase', () => {
        expect(backendToFrontendRole('NASABAH')).toBe('nasabah');
        expect(backendToFrontendRole('ADMIN')).toBe('admin');
        // CRITICAL P0 fix: TELLER must NOT collapse to 'user'
        expect(backendToFrontendRole('TELLER')).toBe('teller');
        // CRITICAL P0 fix: MANAGER must NOT collapse to 'admin'
        expect(backendToFrontendRole('MANAGER')).toBe('manager');
    });

    test('backend -> frontend handles unknowns safely', () => {
        expect(backendToFrontendRole('DEVELOPER')).toBe('admin');
        expect(backendToFrontendRole('UNKNOWN')).toBe('nasabah');
        expect(backendToFrontendRole(undefined)).toBe('nasabah');
        expect(backendToFrontendRole(null)).toBe('nasabah');
    });
});

describe('validationMiddleware — strict amount rules', () => {
    const baseTransfer = { toUserId: 'receiver_01' };

    test('rejects string amount (no Zod coercion)', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: '100' });
        expect(result.success).toBe(false);
    });

    test('rejects NaN', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: NaN });
        expect(result.success).toBe(false);
    });

    test('rejects Infinity', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: Infinity });
        expect(result.success).toBe(false);
    });

    test('rejects zero', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: 0 });
        expect(result.success).toBe(false);
    });

    test('rejects negative', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: -50 });
        expect(result.success).toBe(false);
    });

    test('accepts a positive integer amount', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: 25_000 });
        expect(result.success).toBe(true);
    });

    test('accepts a positive float amount', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: 1234.56 });
        expect(result.success).toBe(true);
    });

    test('rejects amount above max ceiling', () => {
        const result = transferSchema.safeParse({ ...baseTransfer, amount: 999_999_999 });
        expect(result.success).toBe(false);
    });

    test('payment schema enforces same amount rules', () => {
        expect(paymentSchema.safeParse({ toUserId: 'r', amount: '100' }).success).toBe(false);
        expect(paymentSchema.safeParse({ toUserId: 'r', amount: 0 }).success).toBe(false);
        expect(paymentSchema.safeParse({ toUserId: 'r', amount: 1000 }).success).toBe(true);
    });

    test('loan schema caps at 100,000 IDR (per requirement)', () => {
        expect(loanSchema.safeParse({ amount: 100_000 }).success).toBe(true);
        expect(loanSchema.safeParse({ amount: 100_001 }).success).toBe(false);
        expect(loanSchema.safeParse({ amount: '50000' }).success).toBe(false);
    });

    test('gateway create schema requires sourceApp and accepts idempotencyKey', () => {
        const ok = gatewayCreateSchema.safeParse({
            fromUserId: 'payer_01',
            toUserId: 'receiver_01',
            amount: 5000,
            type: 'PAYMENT_MARKETPLACE',
            sourceApp: 'marketplace',
            idempotencyKey: 'idem-abc-123',
        });
        expect(ok.success).toBe(true);

        const missingSource = gatewayCreateSchema.safeParse({
            fromUserId: 'payer_01',
            amount: 5000,
            type: 'PAYMENT',
        });
        expect(missingSource.success).toBe(false);
    });
});

describe('validationMiddleware — register rules', () => {
    test('userId longer than 50 chars is rejected', () => {
        const longId = 'a'.repeat(51);
        const result = registerSchema.safeParse({
            userId: longId,
            name: 'Long User',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });

    test('userId with disallowed characters is rejected', () => {
        const result = registerSchema.safeParse({
            userId: 'evil userid!',
            name: 'X',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });

    test('password shorter than 8 chars is rejected', () => {
        const result = registerSchema.safeParse({
            userId: 'shortpw',
            name: 'X',
            password: 'short7c',
        });
        expect(result.success).toBe(false);
    });

    test('exact 8 char password is accepted', () => {
        const result = registerSchema.safeParse({
            userId: 'okuser_01',
            name: 'OK User',
            password: '12345678',
        });
        expect(result.success).toBe(true);
    });

    test('empty name is rejected', () => {
        const result = registerSchema.safeParse({
            userId: 'okuser_02',
            name: '   ',
            password: 'password123',
        });
        expect(result.success).toBe(false);
    });

    test('valid frontend role is accepted', () => {
        const result = registerSchema.safeParse({
            userId: 'okuser_03',
            name: 'Teller User',
            password: 'password123',
            role: 'teller',
        });
        expect(result.success).toBe(true);
    });
});
