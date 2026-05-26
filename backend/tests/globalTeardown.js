// tests/globalTeardown.js
// Runs once after ALL test suites complete — closes the DB pool cleanly
module.exports = async () => {
  const db = require('../config/db');
  try {
    await db.end();
  } catch (e) {
    // Pool may already be closed, ignore
  }
};
