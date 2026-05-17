# 🏦 SmartBank — Sistem Perbankan Digital untuk UMKM

SmartBank adalah platform perbankan digital yang dirancang khusus untuk mendukung ekosistem UMKM Indonesia, memungkinkan transaksi antar pengguna, manajemen saldo, dan layanan pinjaman dalam satu sistem terpadu.

---

## 📂 Struktur Proyek

```
SmartBank/
├── backend/                  # Node.js + Express API
│   ├── config/              # Konfigurasi database
│   ├── controllers/         # Logic bisnis (auth, bank)
│   ├── middlewares/         # Auth, validasi, rate limiting
│   ├── migrations/          # SQL migration untuk database
│   ├── routes/             # Endpoint API
│   ├── tests/              # Unit & integration tests (Jest)
│   ├── e2e-test.sh         # E2E test runner (cURL)
│   ├── server.js           # Entry point Express app
│   └── package.json
├── frontend/                # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── App.tsx        # Komponen utama
│   │   ├── LoginPage.tsx  # Halaman login
│   │   ├── RegisterPage.tsx # Halaman registrasi
│   │   ├── utils.ts       # Fee calculator, loan calculator
│   │   └── utils.test.ts  # Unit tests
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backup/                  # Backup database SQL
├── DESIGN.md               # Design spec
├── Laporan_Testing_SmartBank.docx # Laporan testing
└── database_testing_report.md     # Laporan database
```

---

## 🚀 Cara Instalasi & Menjalankan Sistem

### Prasyarat

| Tool | Versi Minimal |
|------|--------------|
| Node.js | v18+ |
| npm | v9+ |
| MySQL | v8.0+ |
| Git | v2+ |

### Langkah 1: Clone Repository

```bash
git clone https://github.com/RPL2-Becode/SmartBank.git
cd SmartBank
```

### Langkah 2: Setup Database (MySQL via Laragon)

1. Buka **Laragon** → klik **Database** (phpMyAdmin)
2. Buat database baru:

```sql
CREATE DATABASE SmartBank;
```

3. Impor schema awal:

```bash
cd backend
mysql -u root -p SmartBank < database.sql
```

4. Jalankan migration untuk fitur lengkap:

```bash
mysql -u root -p SmartBank < migrations/fix_all.sql
```

### Langkah 3: Setup Environment

```bash
cd backend
cp .env.example .env   # atau buat manual
```

Edit file `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=SmartBank
DB_PORT=3306
JWT_SECRET=GantiDenganSecretYangAman2026
PORT=5000
NODE_ENV=development
```

### Langkah 4: Install Dependensi & Jalankan

```bash
# Backend
cd backend
npm install
npm start           # Jalankan server di http://localhost:5000

# Frontend (di terminal baru)
cd frontend
npm install
npm run dev         # Jalankan di http://localhost:5173
```

---

## 📡 Dokumentasi API

### Autentikasi

#### Register User Baru
```http
POST /smartbank/auth/register
Content-Type: application/json

{
  "userId": "userman",
  "name": "User Manual",
  "password": "Password123!",
  "role": "NASABAH"
}
```
**Response:** `201 Created`

#### Login
```http
POST /smartbank/auth/login
Content-Type: application/json

{
  "userId": "userman",
  "password": "Password123!"
}
```
**Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "userId": "userman",
      "name": "User Manual",
      "role": "NASABAH",
      "tier": "REGULER"
    }
  }
}
```

### Endpoint Terproteksi (Butuh JWT Token)

Tambahkan header pada setiap request:
```http
Authorization: Bearer <token_yang_di dapat_dari_login>
```

#### Cek Saldo
```http
GET /smartbank/balance
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "userId": "userman",
    "balance": 50000.00,
    "tier": "REGULER"
  }
}
```

#### Transfer Saldo
```http
POST /smartbank/transfer
Content-Type: application/json

{
  "toUserId": "tujuan",
  "amount": 50000
}
```

#### Minta Pinjaman
```http
POST /smartbank/loan
Content-Type: application/json

{
  "amount": 1000000
}
```
**Response:**
```json
{
  "status": "success",
  "data": {
    "loanId": 1,
    "amount": 1000000,
    "interestRate": 0.10,
    "totalDue": 1100000,
    "dueDate": "2026-06-17",
    "status": "APPROVED"
  }
}
```

#### Bayar Angsuran
```http
POST /smartbank/loan/:loanId/pay
```

#### Cek History Transaksi
```http
GET /smartbank/history
```

#### Cek Ledger
```http
GET /smartbank/ledger
```

### Ringkasan Endpoint

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/smartbank/auth/register` | Registrasi user baru | ❌ |
| POST | `/smartbank/auth/login` | Login user | ❌ |
| GET | `/smartbank/balance` | Cek saldo | ✅ |
| POST | `/smartbank/transfer` | Transfer saldo | ✅ |
| POST | `/smartbank/loan` | Minta pinjaman | ✅ |
| POST | `/smartbank/loan/:id/pay` | Bayar angsuran | ✅ |
| GET | `/smartbank/history` | History transaksi | ✅ |
| GET | `/smartbank/ledger` | Ledger 100 transaksi | ✅ |

---

## 🧮 Kalkulator Fee & Loan

### Fee Kalkulator (Frontend)

```typescript
import { calculateFee } from './utils';

// Marketplace fee (2%)
calculateFee('marketplace', 100000) // → { baseAmount: 100000, fee: 2000, tax: 2000, total: 104000 }

// Logistics fee (5% flat)
calculateFee('logistic', 100000) // → { baseAmount: 100000, fee: 5000, tax: 2000, total: 107000 }

// Supplier fee (3%)
calculateFee('supplier', 100000) // → { baseAmount: 100000, fee: 3000, tax: 2000, total: 105000 }
```

### Loan Kalkulator

```typescript
import { calculateLoan } from './utils';

// Pinjaman 1jt dengan bunga 10% (30 hari)
calculateLoan(1000000, 30) // → { amount: 1000000, interestRate: 0.10, totalDue: 1100000, dueDate: "2026-06-17" }
```

---

## 🗄️ Struktur Database

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user (ID, nama, password, role, tier, balance, loan) |
| `transactions` | Record transaksi (refId, type, fromUserId, toUserId, amount, fee, tax) |
| `loans` | Pinjaman (userId, amount, interestRate, totalDue, status) |
| `system_rates` | Rate dinamis (fee bank, fee marketplace, pajak, bunga) |
| `loan_installments` | Cicilan pinjaman per periode |
| `tax_collections` | Audit trail pajak transaksi |
| `fee_collections` | Audit trail biaya transaksi |

### Roles

| Role | Akses |
|------|-------|
| `NASABAH` | User biasa, bisa transfer, minta loan |
| `ADMIN` | Full access |
| `TELLER` | Transaksi kas |
| `MANAGER` | Approval pinjaman |

### Tiers

| Tier | Syarat | Max Loan |
|------|--------|----------|
| `REGULER` | Default | Rp 5.000.000 |
| `GOLD` | Balance ≥ Rp 10.000.000 | Rp 20.000.000 |
| `PRIORITAS` | Balance ≥ Rp 50.000.000 | Rp 100.000.000 |

---

## 🧪 Menjalankan Testing

### Backend Tests (Jest)

```bash
cd backend
npm test

# Output:
# Test Suites: 2 passed, 2 total
# Tests: 54 passed, 54 total
```

**Test coverage:**
- Auth: register, login, validasi
- Security: SQL injection, XSS, JWT tampering
- Helmet: security headers
- Rate limiting: anti-spam

### Frontend Tests (Vitest)

```bash
cd frontend
npm test

# Output:
# Test Files: 1 passed
# Tests: 4 passed (fee calc, loan calc, access control)
```

### E2E Tests

```bash
cd backend
bash e2e-test.sh
```

Atau dengan Node.js:

```bash
node e2e-runner.mjs
```

---

## 🔒 Keamanan

SmartBank implements several security layers:

| Fitur | Implementasi |
|-------|-------------|
| SQL Injection Prevention | Parameterized queries (mysql2) |
| XSS Protection | Helmet.js headers + Zod validation |
| JWT Authentication | HS256, 1-day expiry, tamper detection |
| CORS | Whitelist: localhost:5173, localhost:3000 |
| Rate Limiting | 5 req/menit (auth), 50 req/menit (umum) |
| Password Hashing | bcryptjs (10 rounds) |
| Security Headers | CSP, HSTS, X-Frame-Options |

---

## 🔧 Konfigurasi Tambahan

### Rate Limiting (Production)

```javascript
// Di server.js — tingkatkan batas untuk production
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 5, // 5 untuk dev
  message: { status: 'error', message: 'Terlalu banyak request' }
});
```

### Menambah User Manual via MySQL

```sql
INSERT INTO users (userId, name, password, role, tier, balance)
VALUES ('admin', 'Administrator', '$2a$10$...', 'ADMIN', 'REGULER', 0);
-- Password hashing: bcrypt('admin123', 10)
```

---

## 🛠️ Troubleshooting

### Error: `ER_ACCESS_DENIED_ERROR`
Pastikan kredensial MySQL di `.env` benar (user: root, password kosong untuk Laragon default).

### Error: `Can't connect to MySQL server`
Pastikan Laragon/MySQL running di port 3306.

### Error: `Pool is closed`
Jalankan `npm test` di folder `backend` (bukan root).

### Migration Gagal (Duplicate FK)
```bash
# Drop semua constraint lalu jalankan ulang
mysql -u root -p SmartBank < migrations/rollback.sql
mysql -u root -p SmartBank < migrations/fix_all.sql
```

---

## 👥 Kontributor

| Nama | Peran |
|------|-------|
| Tim RPL 2 Becode | Backend, Frontend, Database |

---

## 📄 Lisensi

MIT License — Gunakan untuk proyek pembelajaran dan komersial.

---

*Terakhir diperbarui: 17 Mei 2026*
