// tests/setup.js
//
// Best-effort test bootstrap. Pure-unit test files (no DB required) must
// still pass when MySQL is unavailable, so the table creation is wrapped
// in a try/catch and only emits a warning instead of failing the suite.
const db = require('../config/db');

beforeAll(async () => {
  try {
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
  } catch (error) {
    // Pure-unit suites do not touch the DB, so we keep going.
    // Integration suites will fail naturally when they actually query.
    // eslint-disable-next-line no-console
    console.warn(`[tests/setup] users table init skipped: ${error.message}`);
  }
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
