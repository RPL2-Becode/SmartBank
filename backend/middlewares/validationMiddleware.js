const { z } = require('zod');

// ---- Shared helpers ----------------------------------------------------

// Maximum value any single transaction amount can reach. The total money
// supply rule caps the system at 1,000,000,000 IDR, so 100,000,000 IDR is
// a generous per-transaction ceiling that still triggers proper alerts.
const MAX_AMOUNT = 100_000_000;
const MAX_LOAN_AMOUNT = 100_000;

/**
 * Strict money amount validator. Rejects:
 *  - non-number types (no string coercion, no NaN, no Infinity)
 *  - zero, negative
 *  - values above the configured maximum
 *
 * @param {object} [opts]
 * @param {number} [opts.max]
 * @param {string} [opts.maxMessage]
 */
const moneyAmount = ({ max = MAX_AMOUNT, maxMessage } = {}) =>
  z
    .number({
      required_error: 'Jumlah wajib diisi',
      invalid_type_error: 'Jumlah harus berupa angka',
    })
    .finite({ message: 'Jumlah harus angka berhingga (bukan Infinity/NaN)' })
    .positive({ message: 'Jumlah harus lebih dari 0' })
    .max(max, { message: maxMessage || `Jumlah maksimal ${max.toLocaleString('id-ID')}` });

// userId column in DB is VARCHAR(50). Accept letters, digits, underscore, dash.
const USER_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const userIdField = z
  .string()
  .min(3, { message: 'userId minimal 3 karakter' })
  .max(50, { message: 'userId maksimal 50 karakter' })
  .regex(USER_ID_REGEX, {
    message: 'userId hanya boleh huruf, angka, underscore (_), dan dash (-)',
  });

const passwordField = z
  .string()
  .min(8, { message: 'Password minimal 8 karakter' })
  .max(255, { message: 'Password terlalu panjang (maks 255 karakter)' });

const nameField = z
  .string()
  .trim()
  .min(1, { message: 'Nama wajib diisi' })
  .max(100, { message: 'Nama maksimal 100 karakter' });

// Accept frontend lowercase, backend UPPERCASE, and legacy aliases. The
// authController normalizes whatever value lands here to the canonical
// backend role before persisting, so the schema can be permissive.
const roleField = z
  .enum([
    'NASABAH', 'ADMIN', 'TELLER', 'MANAGER',
    'nasabah', 'admin', 'teller', 'manager',
    'user', 'developer', 'insight_readonly',
  ])
  .optional();

// ---- Schemas -----------------------------------------------------------

const registerSchema = z.object({
  userId: userIdField.optional(),
  name: nameField,
  password: passwordField,
  role: roleField,
  tier: z.enum(['REGULER', 'GOLD', 'PRIORITAS']).optional(),
});

const loginSchema = z.object({
  userId: z.string().min(1, { message: 'userId wajib diisi' }).max(50),
  password: z.string().min(1, { message: 'Password wajib diisi' }).max(255),
});

const transferSchema = z.object({
  toUserId: z
    .string()
    .min(1, { message: 'User ID penerima wajib diisi' })
    .max(50, { message: 'userId penerima maksimal 50 karakter' })
    .regex(USER_ID_REGEX, { message: 'userId penerima format tidak valid' }),
  amount: moneyAmount(),
});

const paymentSchema = z.object({
  // fromUserId is intentionally ignored — controller forces it from JWT.
  // We still allow it to be present in body for backward compatibility,
  // but never trust it.
  fromUserId: z.string().max(50).optional(),
  toUserId: z
    .string()
    .min(1, { message: 'User ID penerima wajib diisi' })
    .max(50, { message: 'userId penerima maksimal 50 karakter' })
    .regex(USER_ID_REGEX, { message: 'userId penerima format tidak valid' }),
  amount: moneyAmount(),
  type: z
    .enum([
      'PAYMENT_MARKETPLACE',
      'PAYMENT_POS',
      'PAYMENT_SUPPLIER',
      'PAYMENT_LOGISTIC',
      'PAYMENT_INSIGHT',
      'PAYMENT',
    ])
    .optional(),
  description: z.string().max(255).optional(),
});

const loanSchema = z.object({
  amount: moneyAmount({
    max: MAX_LOAN_AMOUNT,
    maxMessage: `Maksimal pinjaman Rp ${MAX_LOAN_AMOUNT.toLocaleString('id-ID')}`,
  }),
});

const payLoanSchema = z.object({
  installmentId: z
    .number({
      required_error: 'installmentId wajib diisi',
      invalid_type_error: 'installmentId harus berupa angka',
    })
    .int({ message: 'installmentId harus bilangan bulat' })
    .positive({ message: 'installmentId harus positif' }),
});

// Gateway: external apps create payment requests through this schema.
const gatewayCreateSchema = z.object({
  fromUserId: z
    .string()
    .min(1, { message: 'fromUserId wajib diisi' })
    .max(50)
    .regex(USER_ID_REGEX, { message: 'fromUserId format tidak valid' }),
  toUserId: z
    .string()
    .max(50)
    .regex(USER_ID_REGEX, { message: 'toUserId format tidak valid' })
    .optional(),
  amount: moneyAmount(),
  type: z.enum([
    'PAYMENT_MARKETPLACE',
    'PAYMENT_POS',
    'PAYMENT_SUPPLIER',
    'PAYMENT_LOGISTIC',
    'PAYMENT_INSIGHT',
    'PAYMENT',
    'TOPUP',
    'WITHDRAWAL',
    'EXTERNAL_PAYMENT',
  ]),
  sourceApp: z
    .string()
    .min(1, { message: 'sourceApp wajib diisi' })
    .max(50),
  idempotencyKey: z.string().max(120).optional(),
  metadata: z.record(z.any()).optional(),
});

const gatewayCallbackSchema = z.object({
  orderId: z.string().min(1, { message: 'orderId wajib diisi' }).max(100),
  action: z.enum(['approve', 'reject'], { message: 'action harus approve atau reject' }),
  signature: z.string().max(255).optional(),
});

// ---- Generic validator factory ----------------------------------------

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = (result.error?.errors || []).map((err) => ({
      field: Array.isArray(err.path) ? err.path.join('.') : String(err.path || ''),
      message: err.message,
    }));
    return res.status(400).json({
      status: 'error',
      message: 'Validasi gagal',
      errors,
    });
  }
  req.validatedData = result.data;
  return next();
};

// ---- Middleware exports ------------------------------------------------

module.exports = {
  // Schemas (exported for unit tests)
  registerSchema,
  loginSchema,
  transferSchema,
  paymentSchema,
  loanSchema,
  payLoanSchema,
  gatewayCreateSchema,
  gatewayCallbackSchema,

  // Middleware
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateTransfer: validate(transferSchema),
  validatePayment: validate(paymentSchema),
  validateLoan: validate(loanSchema),
  validatePayLoan: validate(payLoanSchema),
  validateGatewayCreate: validate(gatewayCreateSchema),
  validateGatewayCallback: validate(gatewayCallbackSchema),

  // Constants for reuse
  MAX_AMOUNT,
  MAX_LOAN_AMOUNT,
  USER_ID_REGEX,
};
