# 🏦 SmartBank — Sistem Perbankan Digital untuk UMKM

SmartBank adalah platform perbankan digital yang dirancang khusus untuk mendukung ekosistem UMKM Indonesia. Sistem ini menyediakan layanan transaksi antar pengguna, manajemen saldo, pinjaman, dan fee engine dalam satu sistem terpadu dengan antarmuka dashboard premium berbasis React.

---

## 📂 Struktur Proyek

```
SmartBank/
├── backend/                    # Node.js + Express API
│   ├── config/                 # Konfigurasi database (MySQL pool)
│   ├── controllers/
│   │   ├── authController.js   # Register & login
│   │   └── bankController.js   # Balance, transfer, payment, loan, ledger, history
│   ├── middlewares/
│   │   ├── authMiddleware.js   # JWT verifier
│   │   └── validationMiddleware.js # Zod schema validator
│   ├── migrations/
│   │   └── fix_all.sql         # Migration script untuk database yang sudah ada
│   ├── routes/
│   │   ├── authRoutes.js       # POST /auth/register, POST /auth/login
│   │   └── bankRoutes.js       # GET|POST /balance /transfer /payment /loan /loans /loan/pay /ledger /history
│   ├── tests/                  # Unit & integration tests (Jest)
│   ├── e2e-runner.mjs          # E2E test runner (Node.js)
│   ├── e2e-test.sh             # E2E test runner (cURL/bash)
│   ├── openapi.yaml            # Swagger/OpenAPI 3.0 specification
│   ├── server.js               # Entry point Express app
│   └── package.json
├── frontend/                   # React 19 + Vite + TypeScript
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts       # Centralized API client (fetch + auth headers)
│   │   ├── components/
│   │   │   ├── AuthComponents.tsx  # Form components & animasi auth
│   │   │   └── ui.tsx              # Modal, Drawer, shared UI primitives
│   │   ├── App.tsx             # Komponen utama + semua halaman dashboard
│   │   ├── LoginPage.tsx       # Halaman login
│   │   ├── RegisterPage.tsx    # Halaman registrasi (pilih role)
│   │   ├── banking.ts          # Banking API helpers
│   │   ├── types.ts            # TypeScript types (User, UserRole, Loan, dll)
│   │   ├── utils.ts            # Fee/loan calculator, canAccess, formatDateTime
│   │   ├── utils.test.ts       # Unit tests (Vitest)
│   │   ├── styles.css          # Design system & komponen CSS
│   │   └── harmony.css         # Auth & landing page styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── Context/                    # Konteks dan catatan desain
├── CHANGE.md                   # Changelog perubahan proyek
├── README.md                   # Dokumentasi proyek (file ini)
├── planning.md                 # Rencana proyek
└── rencana.md                  # Catatan rencana
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
npm start           # Server berjalan di http://localhost:5000

# Frontend (di terminal baru)
cd frontend
npm install
npm run dev         # Dashboard di http://localhost:5173
```

### Akses Swagger UI

Setelah backend berjalan, buka: **http://localhost:5000/api-docs**

---

## 📡 Ringkasan 10 Endpoint API

| # | Method | Endpoint | Deskripsi | Auth |
|---|--------|----------|-----------|------|
| 1 | POST | `/smartbank/auth/register` | Registrasi user baru | ❌ |
| 2 | POST | `/smartbank/auth/login` | Login & dapat JWT token | ❌ |
| 3 | GET | `/smartbank/balance` | Cek saldo + 10 transaksi terakhir | ✅ |
| 4 | POST | `/smartbank/transfer` | Transfer saldo ke user lain | ✅ |
| 5 | POST | `/smartbank/payment` | Pembayaran (Marketplace/POS/Supplier/Logistik) | ✅ |
| 6 | POST | `/smartbank/loan` | Ajukan pinjaman | ✅ |
| 7 | GET | `/smartbank/loans` | Lihat daftar pinjaman | ✅ |
| 8 | POST | `/smartbank/loan/pay` | Bayar angsuran pinjaman | ✅ |
| 9 | GET | `/smartbank/history` | History transaksi user | ✅ |
| 10 | GET | `/smartbank/ledger` | Ledger seluruh transaksi (admin/teller/manager) | ✅ |

> Dokumentasi lengkap dengan Try It Out tersedia di: **http://localhost:5000/api-docs**

### Contoh: Register User Baru

```http
POST /smartbank/auth/register
Content-Type: application/json

{
  "userId": "yonaldi01",
  "name": "Yonaldi Ernanda",
  "password": "Password123!",
  "role": "NASABAH"
}
```
**Response:** `201 Created`

### Contoh: Login

```http
POST /smartbank/auth/login
Content-Type: application/json

{
  "userId": "yonaldi01",
  "password": "Password123!"
}
```
**Response:**
```json
{
  "status": "success",
  "message": "Login berhasil!",
  "token": "eyJhbG...",
  "user": {
    "userId": "yonaldi01",
    "name": "Yonaldi Ernanda",
    "role": "NASABAH",
    "tier": "REGULER",
    "balance": 50000.00
  }
}
```

---

## 🖥️ Fitur Frontend Dashboard

Dashboard SmartBank dibangun dengan React 19 + TypeScript + Vite dan mencakup:

| Halaman | Route | Akses |
|---------|-------|-------|
| Landing Page | `/` | Publik |
| Login | `/login` | Publik |
| Registrasi | `/register` | Publik |
| Dashboard | `/dashboard` | Semua role |
| Balance & Wallet | `/balance` | Semua role |
| Transfer | `/transfers` | Nasabah |
| Payment Request | `/payment-requests` | Admin, Teller, Manager |
| Ledger | `/ledger` | Semua role |
| Loans | `/loans` | Semua role |
| Fee Engine | `/fees` | Admin, Manager |
| Bank Fees | `/bank-fees` | Admin, Manager |
| Integrations | `/integrations` | Admin, Manager |
| API Logs | `/api-logs` | Admin, Manager |
| Settings | `/settings` | Semua role |
| Dokumentasi | `/docs` | Publik |
| Swagger UI | http://localhost:5000/api-docs | Publik |

---

## 👤 Sistem Role

| Role | Deskripsi | Akses Utama |
|------|-----------|-------------|
| `NASABAH` | Pengguna standar | Balance, Transfer, Loans, Ledger (milik sendiri) |
| `ADMIN` | Kontrol penuh sistem | Semua fitur + Fee Engine + Integrations |
| `TELLER` | Staf kasir | Balance, Payment Request, Ledger |
| `MANAGER` | Manajer cabang | Balance, Payment Request, Ledger, Fee Engine, Integrations |

---

## 🗄️ Struktur Database

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user (userId, nama, password, role, tier, balance, loan) |
| `transactions` | Semua transaksi (refId, type, fromUserId, toUserId, baseAmount, fee, tax) |
| `loans` | Data pinjaman (userId, amount, interestRate, totalDue, status, dueDate) |
| `loan_installments` | Cicilan pinjaman per periode (amountDue, penaltyAmount, paidAt) |
| `system_rates` | Rate dinamis (fee bank, fee marketplace, pajak, bunga, denda) |
| `tax_collections` | Audit trail pajak transaksi |
| `fee_collections` | Audit trail biaya transaksi |

### Tier User

| Tier | Syarat | Max Loan |
|------|--------|----------|
| `REGULER` | Default | Rp 5.000.000 |
| `GOLD` | Balance ≥ Rp 10.000.000 | Rp 20.000.000 |
| `PRIORITAS` | Balance ≥ Rp 50.000.000 | Rp 100.000.000 |

---

## 🧮 Kalkulator Fee & Loan (Frontend Utils)

```typescript
import { calculateFee, calculateLoan } from './utils';

// Fee transfer (bank 1% + pajak 2%)
calculateFee('manual_transfer', 100000)
// → { principalAmount: 100000, bankFee: 1000, tax: 2000, totalFee: 3000, totalDebit: 103000 }

// Fee marketplace (app 2% + gateway 0.5% + bank 1% + pajak 2%)
calculateFee('marketplace', 100000)
// → { principalAmount: 100000, appFee: 2000, gatewayFee: 500, bankFee: 1000, tax: 2000, totalFee: 5500, totalDebit: 105500 }

// Kalkulator pinjaman (bunga 10%)
calculateLoan(80000)
// → { principal: 80000, interestRate: 0.10, interestAmount: 8000, totalRepayment: 88000 }
```

---

## 🧪 Menjalankan Testing

### Backend Tests (Jest)

```bash
cd backend
npm test
```

### Frontend Tests (Vitest)

```bash
cd frontend
npm test
# Tests: 4 passed (fee calc, loan calc, canAccess teller, dll)
```

### E2E Tests

```bash
cd backend
node e2e-runner.mjs      # atau: bash e2e-test.sh
```

---

## 🔒 Keamanan

| Fitur | Implementasi |
|-------|-------------|
| SQL Injection Prevention | Parameterized queries (mysql2) |
| XSS Protection | Helmet.js headers + Zod validation |
| JWT Authentication | HS256, 1-day expiry, tamper detection |
| CORS | Whitelist: localhost:5173, 127.0.0.1:5173, localhost:5000 |
| Rate Limiting | 5 req/menit (auth), 50 req/menit (umum) |
| Password Hashing | bcryptjs (10 rounds) |
| Security Headers | CSP, HSTS, X-Frame-Options |

---

## 🛠️ Troubleshooting

### Error: `ER_ACCESS_DENIED_ERROR`
Pastikan kredensial MySQL di `.env` benar (default Laragon: user `root`, password kosong).

### Error: `Can't connect to MySQL server`
Pastikan Laragon/MySQL running di port 3306.

### Error: `Pool is closed`
Jalankan `npm test` di folder `backend`, bukan di root project.

### Frontend blank / kosong setelah login
Pastikan backend sudah running di `http://localhost:5000` sebelum membuka frontend.

### Migration Gagal (Duplicate FK)
```bash
mysql -u root -p SmartBank < migrations/fix_all.sql
```

---

## 👥 Kontributor

| Nama | Peran |
|------|-------|
| Tim RPL 2 Becode | Backend API, Frontend Dashboard, Database Design, Testing |

---

## 📄 Lisensi

MIT License — Gunakan untuk proyek pembelajaran dan komersial.

---

*Terakhir diperbarui: 25 Mei 2026*
