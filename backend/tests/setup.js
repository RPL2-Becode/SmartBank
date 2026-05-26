// tests/setup.js
const db = require('../config/db');

beforeAll(async () => {
  // Setup test database
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('NASABAH', 'ADMIN', 'TELLER', 'MANAGER') DEFAULT 'NASABAH',
      tier ENUM('REGULER', 'GOLD', 'PRIORITAS') DEFAULT 'REGULER',
      balance DECIMAL(15, 2) DEFAULT 0.00,
      loan DECIMAL(15, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
});

afterAll(async () => {
  // Cleanup test users (bank tests clean their own users)
  try {
    await db.query('DELETE FROM users WHERE userId LIKE ?', ['test%']);
    // Note: db.end() is handled by globalTeardown to avoid pool-closed errors
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
});
