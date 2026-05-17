#!/bin/bash
# =============================================
# SmartBank E2E Testing Script
# =============================================
API="http://localhost:5000"
TIMESTAMP=$(date +%s)
USER1="testuser_${TIMESTAMP}_1"
USER2="testuser_${TIMESTAMP}_2"
PASS="password123"
PASS2="password456"
TOKEN1=""
TOKEN2=""
INSTALLMENT_ID=""

echo "============================================"
echo "  SMARTBANK E2E TESTING"
echo "  Timestamp: $(date)"
echo "  User1: $USER1"
echo "  User2: $USER2"
echo "============================================"

# -------------------------------------------------------
# TEST 1: Register User 1
# -------------------------------------------------------
echo ""
echo "=== TEST 1: REGISTER USER 1 ==="
RESP=$(curl -s -X POST "$API/smartbank/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER1\",\"name\":\"Test User 1\",\"password\":\"$PASS\",\"role\":\"NASABAH\",\"tier\":\"REGULER\"}")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo "✅ REGISTER USER 1: SUCCESS"
else
  echo "❌ REGISTER USER 1: FAILED"
fi

# -------------------------------------------------------
# TEST 2: Register User 2
# -------------------------------------------------------
echo ""
echo "=== TEST 2: REGISTER USER 2 ==="
RESP=$(curl -s -X POST "$API/smartbank/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER2\",\"name\":\"Test User 2\",\"password\":\"$PASS2\",\"role\":\"NASABAH\",\"tier\":\"REGULER\"}")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo "✅ REGISTER USER 2: SUCCESS"
else
  echo "❌ REGISTER USER 2: FAILED"
fi

# -------------------------------------------------------
# TEST 3: Login User 1
# -------------------------------------------------------
echo ""
echo "=== TEST 3: LOGIN USER 1 ==="
RESP=$(curl -s -X POST "$API/smartbank/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER1\",\"password\":\"$PASS\"}")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
TOKEN1=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ] && [ -n "$TOKEN1" ]; then
  echo "✅ LOGIN USER 1: SUCCESS (token: ${TOKEN1:0:20}...)"
else
  echo "❌ LOGIN USER 1: FAILED"
  exit 1
fi

# -------------------------------------------------------
# TEST 4: Login User 2
# -------------------------------------------------------
echo ""
echo "=== TEST 4: LOGIN USER 2 ==="
RESP=$(curl -s -X POST "$API/smartbank/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER2\",\"password\":\"$PASS2\"}")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
TOKEN2=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ] && [ -n "$TOKEN2" ]; then
  echo "✅ LOGIN USER 2: SUCCESS"
else
  echo "❌ LOGIN USER 2: FAILED"
  exit 1
fi

# -------------------------------------------------------
# TEST 5: Get Balance User 1
# -------------------------------------------------------
echo ""
echo "=== TEST 5: GET BALANCE USER 1 ==="
RESP=$(curl -s "$API/smartbank/balance" -H "Authorization: Bearer $TOKEN1")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
BALANCE=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('balance',''))" 2>/dev/null)
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ] && [ "$BALANCE" = "50000" ]; then
  echo "✅ GET BALANCE: SUCCESS (Balance=$BALANCE)"
else
  echo "❌ GET BALANCE: FAILED (got balance=$BALANCE)"
fi

# -------------------------------------------------------
# TEST 6: Transfer from User 1 to User 2
# -------------------------------------------------------
echo ""
echo "=== TEST 6: TRANSFER USER1 -> USER2 (10000) ==="
sleep 1  # wait for cooldown
RESP=$(curl -s -X POST "$API/smartbank/transfer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d "{\"toUserId\":\"$USER2\",\"amount\":10000}")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo "✅ TRANSFER: SUCCESS"
else
  echo "❌ TRANSFER: FAILED"
fi

# -------------------------------------------------------
# TEST 7: Check Balance after transfer
# -------------------------------------------------------
echo ""
echo "=== TEST 7: CHECK BALANCE AFTER TRANSFER ==="
echo "--- User 1 ---"
RESP1=$(curl -s "$API/smartbank/balance" -H "Authorization: Bearer $TOKEN1")
echo "$RESP1" | python3 -m json.tool 2>/dev/null || echo "$RESP1"
BAL1=$(echo "$RESP1" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('balance',''))" 2>/dev/null)
echo "User 1 Balance: $BAL1"

echo "--- User 2 ---"
RESP2=$(curl -s "$API/smartbank/balance" -H "Authorization: Bearer $TOKEN2")
echo "$RESP2" | python3 -m json.tool 2>/dev/null || echo "$RESP2"
BAL2=$(echo "$RESP2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('balance',''))" 2>/dev/null)
echo "User 2 Balance: $BAL2"

# After transfer of 10000:
# Fee BANK = 10000 * 0.01 = 100
# Tax = 10000 * 0.02 = 200
# Total deducted = 10000 + 100 + 200 = 10300
# User1 new balance = 50000 - 10300 = 39700
# User2 new balance = 50000 + 10000 = 60000
echo "Expected: User1=39700, User2=60000"

# -------------------------------------------------------
# TEST 8: Request Loan (User 1)
# -------------------------------------------------------
echo ""
echo "=== TEST 8: REQUEST LOAN (User1) ==="
sleep 1
RESP=$(curl -s -X POST "$API/smartbank/loan" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN1" \
  -d '{"amount":50000}')
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
LOAN_TOTAL=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('totalDue',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo "✅ LOAN REQUEST: SUCCESS (amount=50000, totalDue=$LOAN_TOTAL)"
else
  echo "❌ LOAN REQUEST: FAILED"
fi

# -------------------------------------------------------
# TEST 9: Check Balance after loan (User 1)
# -------------------------------------------------------
echo ""
echo "=== TEST 9: CHECK BALANCE AFTER LOAN ==="
RESP=$(curl -s "$API/smartbank/balance" -H "Authorization: Bearer $TOKEN1")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
BAL=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('balance',''))" 2>/dev/null)
LOAN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('loan',''))" 2>/dev/null)
echo "Balance: $BAL, Loan: $LOAN"
# Expected: old_balance(39700) + loan_amount(50000) = 89700

# -------------------------------------------------------
# TEST 10: Get Transaction History (Ledger)
# -------------------------------------------------------
echo ""
echo "=== TEST 10: GET TRANSACTION LEDGER ==="
RESP=$(curl -s "$API/smartbank/ledger" -H "Authorization: Bearer $TOKEN1")
echo "$RESP" | head -c 2000
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo ""
  echo "✅ LEDGER: SUCCESS"
else
  echo ""
  echo "❌ LEDGER: FAILED"
fi

# -------------------------------------------------------
# TEST 11: Get User 1's loan installments to pay
# -------------------------------------------------------
echo ""
echo "=== TEST 11: GET LOAN INSTALLMENTS ==="
# We need to find the installment ID - check ledger or query separately
# Let me get the user's balance which also shows the loan
RESP=$(curl -s "$API/smartbank/balance" -H "Authorization: Bearer $TOKEN1")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"

# -------------------------------------------------------
# TEST 12: Pay Loan (User 1)
# -------------------------------------------------------
echo ""
echo "=== TEST 12: PAY LOAN ==="
# First get the installment id from database via a helper query
INSTALLMENT_ID=$(curl -s "$API/smartbank/ledger" -H "Authorization: Bearer $TOKEN1" | \
  python3 -c "
import sys,json
data = json.load(sys.stdin)
txns = data.get('data',[])
# Find the loan disbursement to know loan was taken
for t in txns:
    if t.get('type') == 'LOAN_DISBURSEMENT' and t.get('toUserId') == '$USER1':
        print('found_disbursement')
" 2>/dev/null)

# We need to query the installment directly from DB
echo "Querying installment from database..."
INSTALLMENT_ID=$(python3 -c "
import mysql.connector
try:
    conn = mysql.connector.connect(host='localhost', user='root', password='', database='SmartBank')
    cursor = conn.cursor()
    cursor.execute('''
        SELECT li.id FROM loan_installments li 
        JOIN loans l ON li.loan_id = l.id 
        WHERE l.userId = %s AND li.status = 'PENDING' 
        ORDER BY li.id DESC LIMIT 1
    ''', ('$USER1',))
    row = cursor.fetchone()
    if row:
        print(row[0])
    else:
        print('NOT_FOUND')
    cursor.close()
    conn.close()
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)
echo "Installment ID: $INSTALLMENT_ID"

if [ "$INSTALLMENT_ID" != "NOT_FOUND" ] && [ "$INSTALLMENT_ID" != "" ]; then
  sleep 1
  RESP=$(curl -s -X POST "$API/smartbank/loan/pay" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN1" \
    -d "{\"installmentId\":$INSTALLMENT_ID}")
  echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
  SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
  if [ "$SUCCESS" = "success" ]; then
    echo "✅ PAY LOAN: SUCCESS"
  else
    echo "❌ PAY LOAN: FAILED"
  fi
else
  echo "❌ Could not find installment ID"
fi

# -------------------------------------------------------
# TEST 13: Final Ledger Check
# -------------------------------------------------------
echo ""
echo "=== TEST 13: FINAL LEDGER CHECK ==="
sleep 1
RESP=$(curl -s "$API/smartbank/ledger" -H "Authorization: Bearer $TOKEN1")
echo "$RESP" | python3 -m json.tool 2>/dev/null || echo "$RESP"
SUCCESS=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null)
if [ "$SUCCESS" = "success" ]; then
  echo "✅ FINAL LEDGER: SUCCESS"
else
  echo "❌ FINAL LEDGER: FAILED"
fi

echo ""
echo "============================================"
echo "  E2E TESTING COMPLETE"
echo "  Timestamp: $(date)"
echo "============================================"
