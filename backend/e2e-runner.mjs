// SmartBank E2E Test Runner
import { createPool } from 'mysql2/promise';

const API = 'http://localhost:5000';
const pool = createPool({
  host: 'localhost', user: 'root', password: '',
  database: 'SmartBank', connectionLimit: 2
});

const ts = Date.now();
const USER1 = `e2e_u1_${ts}`;
const USER2 = `e2e_u2_${ts}`;
const PASS1 = 'testpass123';
const PASS2 = 'testpass456';

let TOKEN1, TOKEN2;

async function api(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) { console.error(`❌ ASSERT FAILED: ${msg}`); process.exit(1); }
  console.log(`  ✓ ${msg}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('='.repeat(60));
  console.log('  SMARTBANK E2E TESTING');
  console.log(`  Users: ${USER1}, ${USER2}`);
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // ----------------------------------------------------
  // TEST 1: Register User 1
  // ----------------------------------------------------
  console.log('\n📌 TEST 1: REGISTER USER 1');
  let r = await api('POST', '/smartbank/auth/register', {
    userId: USER1, name: 'E2E User 1', password: PASS1,
    role: 'NASABAH', tier: 'REGULER'
  });
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Register user 1');
  assert(r.data.user.userId === USER1, 'User ID match');
  assert(r.data.user.balance === 50000, 'Initial balance 50000');

  // ----------------------------------------------------
  // TEST 2: Register User 2
  // ----------------------------------------------------
  console.log('\n📌 TEST 2: REGISTER USER 2');
  r = await api('POST', '/smartbank/auth/register', {
    userId: USER2, name: 'E2E User 2', password: PASS2,
    role: 'NASABAH', tier: 'REGULER'
  });
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Register user 2');
  assert(r.data.user.balance === 50000, 'Initial balance 50000');

  // ----------------------------------------------------
  // TEST 3: Login User 1
  // ----------------------------------------------------
  console.log('\n📌 TEST 3: LOGIN USER 1');
  r = await api('POST', '/smartbank/auth/login', {
    userId: USER1, password: PASS1
  });
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Login user 1');
  TOKEN1 = r.data.token;
  assert(TOKEN1 && TOKEN1.length > 20, 'Token received');
  console.log(`  Token: ${TOKEN1.substring(0, 30)}...`);

  // ----------------------------------------------------
  // TEST 4: Login User 2
  // ----------------------------------------------------
  console.log('\n📌 TEST 4: LOGIN USER 2');
  r = await api('POST', '/smartbank/auth/login', {
    userId: USER2, password: PASS2
  });
  assert(r.data.status === 'success', 'Login user 2');
  TOKEN2 = r.data.token;

  // ----------------------------------------------------
  // TEST 5: Get Balance User 1
  // ----------------------------------------------------
  console.log('\n📌 TEST 5: GET BALANCE USER 1');
  r = await api('GET', '/smartbank/balance', null, TOKEN1);
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Get balance');
  assert(r.data.data.balance === 50000, 'Balance is 50000');
  assert(r.data.data.loan === 0, 'Loan is 0');

  // ----------------------------------------------------
  // TEST 6: Transfer User 1 -> User 2 (10000)
  // ----------------------------------------------------
  console.log('\n📌 TEST 6: TRANSFER USER1 -> USER2 (10000)');
  await sleep(1000);
  r = await api('POST', '/smartbank/transfer',
    { toUserId: USER2, amount: 10000 }, TOKEN1);
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Transfer successful');
  const refId = r.data.data.refId;
  assert(refId && refId.startsWith('TX-'), `RefId format: ${refId}`);

  // ----------------------------------------------------
  // TEST 7: Verify Balances After Transfer
  // ----------------------------------------------------
  console.log('\n📌 TEST 7: VERIFY BALANCES AFTER TRANSFER');
  await sleep(500);
  let b1 = await api('GET', '/smartbank/balance', null, TOKEN1);
  let b2 = await api('GET', '/smartbank/balance', null, TOKEN2);
  console.log(`  User 1 balance: ${b1.data.data.balance}`);
  console.log(`  User 2 balance: ${b2.data.data.balance}`);
  // Expected: User1 = 50000 - 10000 - 100(1% fee) - 200(2% tax) = 39700
  // User2 = 50000 + 10000 = 60000
  assert(b1.data.data.balance === 39700,
    `User1 balance 39700 (got ${b1.data.data.balance})`);
  assert(b2.data.data.balance === 60000,
    `User2 balance 60000 (got ${b2.data.data.balance})`);

  // ----------------------------------------------------
  // TEST 8: Request Loan (50000)
  // ----------------------------------------------------
  console.log('\n📌 TEST 8: REQUEST LOAN (50000)');
  await sleep(1000);
  r = await api('POST', '/smartbank/loan', { amount: 50000 }, TOKEN1);
  console.log(`  Response: ${JSON.stringify(r.data)}`);
  assert(r.data.status === 'success', 'Loan approved');
  const expectedTotalDue = 50000 + (50000 * 0.10); // 55000
  assert(r.data.data.totalDue === expectedTotalDue,
    `Total due ${expectedTotalDue} (got ${r.data.data.totalDue})`);

  // ----------------------------------------------------
  // TEST 9: Verify Balance After Loan
  // ----------------------------------------------------
  console.log('\n📌 TEST 9: VERIFY BALANCE AFTER LOAN');
  b1 = await api('GET', '/smartbank/balance', null, TOKEN1);
  console.log(`  User 1 balance: ${b1.data.data.balance}, loan: ${b1.data.data.loan}`);
  // Balance: 39700 + 50000 = 89700
  assert(b1.data.data.balance === 89700,
    `Balance 89700 (got ${b1.data.data.balance})`);
  assert(b1.data.data.loan === expectedTotalDue,
    `Loan ${expectedTotalDue} (got ${b1.data.data.loan})`);

  // ----------------------------------------------------
  // TEST 10: Get Ledger
  // ----------------------------------------------------
  console.log('\n📌 TEST 10: GET TRANSACTION LEDGER');
  r = await api('GET', '/smartbank/ledger', null, TOKEN1);
  assert(r.data.status === 'success', 'Ledger accessible');
  const txnCount = r.data.data.length;
  console.log(`  Total ledger entries: ${txnCount}`);
  // Should have at least: TRANSFER + LOAN_DISBURSEMENT
  assert(txnCount >= 2, `At least 2 ledger entries (got ${txnCount})`);
  // Check transaction types exist
  const types = r.data.data.map(t => t.type);
  assert(types.includes('TRANSFER'), 'Transfer in ledger');
  assert(types.includes('LOAN_DISBURSEMENT'), 'Loan disbursement in ledger');
  console.log(`  Transaction types: ${[...new Set(types)].join(', ')}`);

  // ----------------------------------------------------
  // TEST 11: Get Installment ID from DB & Pay Loan
  // ----------------------------------------------------
  console.log('\n📌 TEST 11: PAY LOAN');
  const [conn] = await pool.getConnection();
  try {
    const [rows] = await conn.query(`
      SELECT li.id, li.amount_due 
      FROM loan_installments li 
      JOIN loans l ON li.loan_id = l.id 
      WHERE l.userId = ? AND li.status = 'PENDING'
      ORDER BY li.id DESC LIMIT 1
    `, [USER1]);
    console.log(`  Installments found: ${rows.length}`);
    
    if (rows.length > 0) {
      const installmentId = rows[0].id;
      const amountDue = rows[0].amount_due;
      console.log(`  Installment ID: ${installmentId}, Amount Due: ${amountDue}`);
      
      await sleep(1000);
      r = await api('POST', '/smartbank/loan/pay',
        { installmentId }, TOKEN1);
      console.log(`  Response: ${JSON.stringify(r.data)}`);
      assert(r.data.status === 'success', 'Loan payment successful');
      assert(r.data.data.amountPaid >= amountDue, 'Amount paid >= due');
      console.log(`  Paid: ${r.data.data.amountPaid}, Penalty: ${r.data.data.penalty}`);
    } else {
      console.log('  ⚠️ No pending installments found');
    }
  } finally {
    conn.release();
  }

  // ----------------------------------------------------
  // TEST 12: Final Balance Check
  // ----------------------------------------------------
  console.log('\n📌 TEST 12: FINAL BALANCE CHECK');
  b1 = await api('GET', '/smartbank/balance', null, TOKEN1);
  console.log(`  User 1 final balance: ${b1.data.data.balance}, loan: ${b1.data.data.loan}`);
  assert(b1.data.data.loan === 0, `Loan fully paid (got ${b1.data.data.loan})`);
  assert(b1.data.data.balance >= 0, 'Balance is non-negative');

  // ----------------------------------------------------
  // TEST 13: Final Ledger
  // ----------------------------------------------------
  console.log('\n📌 TEST 13: FINAL LEDGER');
  r = await api('GET', '/smartbank/ledger', null, TOKEN1);
  assert(r.data.status === 'success', 'Final ledger accessible');
  const allTypes = r.data.data.map(t => t.type);
  console.log(`  Total entries: ${r.data.data.length}`);
  console.log(`  Transaction types: ${[...new Set(allTypes)].join(', ')}`);
  assert(allTypes.includes('LOAN_REPAYMENT'), 'Loan repayment in ledger');
  
  // Print all ledger entries for final report
  console.log('\n📋 FULL TRANSACTION HISTORY:');
  for (const t of r.data.data) {
    console.log(`  [${t.created_at}] ${t.type.padEnd(20)} ${t.fromUserId} → ${t.toUserId}  amount=${t.baseAmount}  fee=${t.fee}  tax=${t.tax}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ✅ ALL E2E TESTS PASSED SUCCESSFULLY!');
  console.log('='.repeat(60));

  await pool.end();
}

run().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err.message);
  console.error(err);
  process.exit(1);
});
