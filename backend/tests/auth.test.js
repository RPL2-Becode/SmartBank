// tests/auth.test.js
const request = require('supertest');
const app = require('../server');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

beforeAll(async () => {
  // Hapus user test jika sudah ada
  await db.query('DELETE FROM users WHERE userId = ?', ['testuser']);
  await db.query('DELETE FROM users WHERE userId = ?', ['newtestuser']);
  await db.query('DELETE FROM users WHERE userId = ?', ['shortpwuser']);
  
  // Pastikan user test sudah ada untuk login tests
  const hashedPassword = await bcrypt.hash('password123', 10);
  await db.query(
    'INSERT IGNORE INTO users (userId, name, password, role, tier, balance) VALUES (?, ?, ?, ?, ?, ?)',
    ['testuser', 'Test User', hashedPassword, 'NASABAH', 'REGULER', 50000]
  );
});

describe('Auth API Tests', () => {
  describe('POST /smartbank/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/smartbank/auth/register')
        .send({
          userId: 'newtestuser',
          name: 'New Test User',
          password: 'password123',
          role: 'NASABAH',
          tier: 'REGULER'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.user.userId).toBe('newtestuser');
      expect(res.body.user.balance).toBe(50000);
    });

    it('should reject registration with duplicate userId', async () => {
      const res = await request(app)
        .post('/smartbank/auth/register')
        .send({
          userId: 'newtestuser',
          name: 'Test User 2',
          password: 'password456'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User ID sudah terdaftar');
    });

    it('should reject registration with invalid password (too short)', async () => {
      const res = await request(app)
        .post('/smartbank/auth/register')
        .send({
          userId: 'shortpwuser',
          name: 'Short PW User',
          password: 'short'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject registration with missing required fields', async () => {
      const res = await request(app)
        .post('/smartbank/auth/register')
        .send({
          userId: 'incomplete',
          name: 'Incomplete User'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('POST /smartbank/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/smartbank/auth/login')
        .send({
          userId: 'testuser',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.userId).toBe('testuser');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/smartbank/auth/login')
        .send({
          userId: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Password salah');
    });

    it('should reject login with non-existent user', async () => {
      const res = await request(app)
        .post('/smartbank/auth/login')
        .send({
          userId: 'nonexistent',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('User tidak ditemukan');
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/smartbank/auth/login')
        .send({
          userId: 'testuser'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('JWT Token Validation', () => {
    it('should generate valid JWT token on login', async () => {
      const res = await request(app)
        .post('/smartbank/auth/login')
        .send({
          userId: 'testuser',
          password: 'password123'
        });
      
      const token = res.body.token;
      expect(token).toBeDefined();
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe('testuser');
      expect(decoded.role).toBe('NASABAH');
    });
  });
});

describe('Security Tests', () => {
  it('should have Helmet security headers', async () => {
    const res = await request(app)
      .get('/')
    
    // Helmet menambahkan berbagai security headers
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('strict-transport-security');
    expect(res.headers).toHaveProperty('x-content-type-options');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('should limit requests to auth endpoints (rate limiting)', async () => {
    // Test ini hanya relevan saat rate limiting aktif (bukan saat testing)
    if (process.env.NODE_ENV === 'test') {
      console.log('⚠️ Rate limiting dinonaktifkan untuk testing, test dilewati');
      return;
    }
    
    // Kirim 6 request ke endpoint auth (batas adalah 5 per menit)
    const requests = [];
    for (let i = 0; i < 6; i++) {
      requests.push(
        request(app)
          .post('/smartbank/auth/login')
          .send({ userId: 'testuser', password: 'wrongpassword' })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // Request ke-6 seharusnya diblokir
    expect(responses[5].statusCode).toBe(429);
    expect(responses[5].body.message).toContain('Terlalu banyak percobaan autentikasi');
  }, 15000);
});
