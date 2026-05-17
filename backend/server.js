const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./config/db');

dotenv.config();

// Database pool is initialized in config/db.js

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration - Hanya allow origin untuk frontend React (port 5173)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiting untuk semua endpoint (50 request per menit per IP)
const generalLimiter = rateLimit({
 windowMs: 60 * 1000, // 1 menit
 max: 50, // 50 request per menit
 message: { status: 'error', message: 'Terlalu banyak permintaan, coba lagi nanti!' },
 skip: (req) => req.path.startsWith('/smartbank/auth') // Skip auth paths (handled by authLimiter)
});

// Rate Limiting khusus untuk endpoint autentikasi (5 request per menit per IP)
const authLimiter = rateLimit({
 windowMs: 60 * 1000, // 1 menit
 max: 5, // 5 request per menit
 message: { status: 'error', message: 'Terlalu banyak percobaan autentikasi, coba lagi nanti!' },
 skip: (req) => !req.path.startsWith('/smartbank/auth')
});

// Terapkan rate limiting (nonaktifkan untuk testing)
if (process.env.NODE_ENV !== 'test') {
  app.use(authLimiter);
  app.use(generalLimiter);
}

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: "Welcome to SmartBank Core API v1.0" });
});

app.use('/smartbank/auth', require('./routes/authRoutes'));
app.use('/smartbank', require('./routes/bankRoutes'));

// Export app for testing
module.exports = app;

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SmartBank Server berjalan di http://localhost:${PORT}`);
  });
}