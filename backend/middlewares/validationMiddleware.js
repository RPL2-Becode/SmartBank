const { z } = require('zod');

// Schema untuk registrasi
const registerSchema = z.object({
  userId: z.string().min(3).max(50),
  name: z.string().min(1).max(100),
  password: z.string().min(8, { message: 'Password minimal 8 karakter' }),
  role: z.enum(['NASABAH', 'ADMIN', 'TELLER', 'MANAGER']).optional(),
  tier: z.enum(['REGULER', 'GOLD', 'PRIORITAS']).optional()
});

// Schema untuk login
const loginSchema = z.object({
  userId: z.string().min(3).max(50),
  password: z.string().min(1, { message: 'Password harus diisi' })
});

// Middleware untuk validasi registrasi
const validateRegister = (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    req.validatedData = validatedData;
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validasi gagal',
      errors: error.errors.map(err => ({ field: err.path[0], message: err.message }))
    });
  }
};

// Middleware untuk validasi login
const validateLogin = (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    req.validatedData = validatedData;
    next();
  } catch (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validasi gagal',
      errors: error.errors.map(err => ({ field: err.path[0], message: err.message }))
    });
  }
};

module.exports = { validateRegister, validateLogin };
