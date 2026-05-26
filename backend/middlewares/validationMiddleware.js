const { z } = require('zod');

// Schema untuk registrasi
const registerSchema = z.object({
  userId: z.string().min(3).max(255).optional(),
  name: z.string().min(1).max(100),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  role: z.enum(['NASABAH', 'ADMIN', 'TELLER', 'MANAGER', 'user', 'admin', 'developer', 'insight_readonly']).optional(),
  tier: z.enum(['REGULER', 'GOLD', 'PRIORITAS']).optional()
});

// Schema untuk login
const loginSchema = z.object({
  userId: z.string().min(3).max(255),
  password: z.string().min(1, { message: 'Password harus diisi' })
});

// Schema untuk transfer
const transferSchema = z.object({
  toUserId: z.string().min(1, { message: 'User ID penerima wajib diisi' }).max(255),
  amount: z.number({ coerce: true }).positive({ message: 'Jumlah harus lebih dari 0' })
});

// Schema untuk payment
const paymentSchema = z.object({
  fromUserId: z.string().min(1).max(255).optional(),
  toUserId: z.string().min(1, { message: 'User ID penerima wajib diisi' }).max(255),
  amount: z.number({ coerce: true }).positive({ message: 'Jumlah harus lebih dari 0' }),
  type: z.enum(['PAYMENT_MARKETPLACE', 'PAYMENT_POS', 'PAYMENT_SUPPLIER', 'PAYMENT_LOGISTIC', 'PAYMENT_INSIGHT', 'PAYMENT']).optional(),
  description: z.string().max(255).optional()
});

// Schema untuk loan request
const loanSchema = z.object({
  amount: z.number({ coerce: true }).positive({ message: 'Jumlah harus lebih dari 0' }).max(100000, { message: 'Maksimal pinjaman Rp 100.000' })
});

// Schema untuk pay loan
const payLoanSchema = z.object({
  installmentId: z.number({ coerce: true }).int().positive({ message: 'installmentId harus berupa angka positif' })
});

// Schema untuk gateway create
const gatewayCreateSchema = z.object({
  amount: z.number({ coerce: true }).positive({ message: 'Jumlah harus lebih dari 0' }),
  type: z.enum(['TOPUP', 'WITHDRAWAL', 'EXTERNAL_PAYMENT']),
  sourceApp: z.string().max(50).optional()
});

// Schema untuk gateway callback
const gatewayCallbackSchema = z.object({
  orderId: z.string().min(1, { message: 'orderId wajib diisi' }),
  action: z.enum(['approve', 'reject'], { message: 'action harus approve atau reject' }),
  signature: z.string().optional()
});

// Generic validation middleware factory
const validate = (schema) => (req, res, next) => {
  try {
    const validatedData = schema.parse(req.body);
    req.validatedData = validatedData;
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validasi gagal',
      errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
    });
  }
};

// Middleware exports
const validateRegister = validate(registerSchema);
const validateLogin = validate(loginSchema);
const validateTransfer = validate(transferSchema);
const validatePayment = validate(paymentSchema);
const validateLoan = validate(loanSchema);
const validatePayLoan = validate(payLoanSchema);
const validateGatewayCreate = validate(gatewayCreateSchema);
const validateGatewayCallback = validate(gatewayCallbackSchema);

module.exports = {
  validateRegister,
  validateLogin,
  validateTransfer,
  validatePayment,
  validateLoan,
  validatePayLoan,
  validateGatewayCreate,
  validateGatewayCallback
};
