# Tutorial Menjalankan SmartBank di Lokal (Laragon + Terminal)

> Panduan lengkap untuk menjalankan SmartBank CBDC Ecosystem secara lokal menggunakan **Laragon** (MySQL) + terminal, **tanpa Docker**.

---

## Daftar Isi

1. [Arsitektur Lokal](#arsitektur-lokal)
2. [Prasyarat](#prasyarat)
3. [Langkah 0 — Install Dependencies](#langkah-0--install-dependencies)
4. [Langkah 1 — Konfigurasi Environment](#langkah-1--konfigurasi-environment)
5. [Langkah 2 — Buat Database MySQL](#langkah-2--buat-database-mysql)
6. [Langkah 3 — Migrate + Seed Central-Bank](#langkah-3--migrate--seed-central-bank)
7. [Langkah 4 — Buat Tabel Cache Wallet](#langkah-4--buat-tabel-cache-wallet)
8. [Langkah 5 — Jalankan 4 Services](#langkah-5--jalankan-4-services)
9. [Langkah 6 — Smoke Test API](#langkah-6--smoke-test-api)
10. [Langkah 7 — Akses Frontend](#langkah-7--akses-frontend)
11. [Troubleshooting](#troubleshooting)
12. [Reset Environment](#reset-environment)

---

## Arsitektur Lokal

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser: http://localhost:3001                                   │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Frontend (Next.js + Turbopack)        PORT 3001                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │ fetch NEXT_PUBLIC_API_BASE_URL
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│ API Gateway (Express + http-proxy-middleware)  PORT 4000         │
│   /api/bank   →  Central-Bank                                    │
│   /api/wallet →  Wallet                                          │
└─────┬─────────────────────────────────────┬──────────────────────┘
      │                                     │
      ▼                                     ▼
┌──────────────────────────┐    ┌──────────────────────────────────┐
│ Central-Bank Core        │    │ Wallet (Express + mysql2)        │
│ (NestJS + Prisma)        │    │  PORT 6969                       │
│  PORT 3000               │    │                                  │
└──────┬───────────────────┘    └──────┬───────────────────────────┘
       │                               │
       │  MySQL 127.0.0.1:3306         │  MySQL 127.0.0.1:3306
       │  database: central_bank_core  │  (tabel cache tambahan)
       ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ Laragon MySQL 8.x (root, tanpa password)                         │
└──────────────────────────────────────────────────────────────────┘
```

Empat service yang harus jalan bersamaan:

| # | Service      | Port | Path                | Command           |
|---|--------------|------|---------------------|-------------------|
| 1 | Central-Bank | 3000 | `Central-Bank/`     | `pnpm start:dev`  |
| 2 | Wallet       | 6969 | `Wallet/`           | `pnpm dev`        |
| 3 | Gateway      | 4000 | `Gateway/`          | `pnpm dev`        |
| 4 | Frontend     | 3001 | `frontend/`         | `pnpm dev`        |

---

## Prasyarat

Pastikan tools berikut sudah ter-install:

| Tool          | Versi Minimum | Cara Cek         | Cara Install                                                                                  |
|---------------|---------------|------------------|------------------------------------------------------------------------------------------------|
| **Node.js**   | 20.x          | `node -v`        | Download dari [nodejs.org](https://nodejs.org)                                                  |
| **pnpm**      | 10.x          | `pnpm -v`        | `npm i -g pnpm`                                                                                 |
| **Laragon**   | 6+            | Buka Laragon     | Download dari [laragon.org](https://laragon.org/download/)                                      |
| **MySQL**     | 8.x           | via Laragon      | Otomatis ter-install via Laragon (klik **Start All** di Laragon)                                |
| **Git Bash**  | -             | `bash --version` | Sudah ada di Windows 10/11 atau via Laragon Terminal                                           |

### Verifikasi awal (wajib)

Buka terminal Laragon / Git Bash, jalankan:

```bash
node -v
pnpm -v
mysql --version
```

Lalu buka **Laragon → Start All**. Pastikan:
- Apache : hijau
- **MySQL : hijau** ← ini wajib

Cek MySQL hidup di `127.0.0.1:3306`:

```bash
mysql -u root -e "SELECT VERSION();" 2>&1
```

Laragon default: `root` user, **tanpa password**. Kalau MySQL Laragon pernah diset password, sesuaikan `DB_PASSWORD` di file `.env`.

---

## Langkah 0 — Install Dependencies

Buka terminal (Git Bash / Laragon Terminal), lalu:

```bash
cd "C:/CODING/RPL 2/SmartBank"

# Install di tiap service
cd Central-Bank && pnpm install && cd ..
cd Wallet       && pnpm install && cd ..
cd Gateway      && pnpm install && cd ..
cd frontend     && pnpm install && cd ..

echo "✅ Install selesai"
```

Kalau ada service yang sebelumnya pernah di-install dengan `npm`, boleh hapus `node_modules` dan `package-lock.json` di service itu, lalu ulangi `pnpm install`.

---

## Langkah 1 — Konfigurasi Environment

Setiap service punya file `.env` di root foldernya. Buat / edit sesuai panduan di bawah.

### 1.1 `Central-Bank/.env`

```env
# Database
DATABASE_URL=mysql://root:@127.0.0.1:3306/central_bank_core

# Server
PORT=3000
NODE_ENV=development

# JWT (HARUS SAMA dengan Wallet & Gateway!)
JWT_SECRET=laragon_local_dev_secret_min_32_chars_abcdef123456
JWT_ISSUER=smartbank
JWT_AUDIENCE=smartbank-clients

# Monetary policy
TOTAL_MONEY_SUPPLY=1000000000
INITIAL_USER_BALANCE=50000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173,http://localhost:6969
```

### 1.2 `Wallet/.env`

```env
# Server
PORT=6969
NODE_ENV=development

# JWT (sama dengan Central-Bank & Gateway)
JWT_SECRET=laragon_local_dev_secret_min_32_chars_abcdef123456
JWT_ISSUER=smartbank
JWT_AUDIENCE=smartbank-clients
JWT_ACCESS_EXPIRES=3600
JWT_REFRESH_EXPIRES=604800

# Database (Laragon MySQL, root tanpa password)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=central_bank_core

# Central-Bank integration
CENTRAL_BANK_CORE_URL=http://localhost:3000
MOCK_CENTRAL_BANK=false
ENABLE_STAFF_SEED=true

# CBDC policy
COOLDOWN_SECONDS=10
DAILY_LIMIT_COUNT=10
MAX_TRANSFER_PER_TX=50000

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:6969,http://localhost:5173
```

> **Penting:** `MOCK_CENTRAL_BANK=false` artinya Wallet HTTP-call **beneran** ke Central-Bank. Kalau `true`, Wallet pakai in-memory mock (tidak connect DB, fitur terbatas).

### 1.3 `Gateway/.env`

```env
# Server
PORT=4000

# JWT (sama dengan Central-Bank & Wallet)
JWT_SECRET=laragon_local_dev_secret_min_32_chars_abcdef123456

# Upstream services
CENTRAL_BANK_URL=http://localhost:3000
WALLET_URL=http://localhost:6969

# CORS — asal frontend
CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173

# Network
TRUST_PROXY=false
```

### 1.4 `frontend/.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

> `frontend/.env.local` **tidak di-commit** ke git (standar Next.js). Buat manual.

---

## Langkah 2 — Buat Database MySQL

Buka terminal MySQL Laragon (klik kanan Laragon tray → **MySQL → MySQL console**), atau terminal biasa:

```bash
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS central_bank_core
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
SQL
```

Harus muncul `central_bank_core` di daftar database.

---

## Langkah 3 — Migrate + Seed Central-Bank

```bash
cd "C:/CODING/RPL 2/SmartBank/Central-Bank"

# Terapkan semua migration yang ada
npx prisma migrate deploy

# Seed data awal: staff accounts + central reserve wallet
node prisma/seed.js
```

Output yang diharapkan:

```
✅ Database migrated successfully
✅ Central reserve account created
✅ Staff seeded: teller@test.com
✅ Staff seeded: manager@test.com
✅ Staff seeded: admin@test.com
```

Verifikasi:

```bash
mysql -u root central_bank_core -e "SELECT id, email, role FROM users;"
```

Harus muncul 3 user staff: `teller@test.com`, `manager@test.com`, `admin@test.com`.

---

## Langkah 4 — Buat Tabel Cache Wallet

Wallet butuh 3 tabel tambahan di database yang sama: `users` (cache), `wallet_accounts_cache`, `loans`. Jalankan SQL berikut:

```bash
mysql -u root central_bank_core <<'SQL'

-- Tabel users (read-cache untuk login lokal Wallet)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  phone VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NULL,
  kyc_tier ENUM('BASIC','VERIFIED') DEFAULT 'BASIC',
  status ENUM('ACTIVE','SUSPENDED') DEFAULT 'ACTIVE',
  role ENUM('WALLET_USER','TELLER','MANAGER','CENTRAL_BANK_ADMIN') NOT NULL DEFAULT 'WALLET_USER',
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

-- Tabel cache wallet account (read-model)
CREATE TABLE IF NOT EXISTS wallet_accounts_cache (
  wallet_id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  available_balance BIGINT NOT NULL DEFAULT 0,
  hold_balance BIGINT NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'CBDC_IDR',
  updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- Tabel loans
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  wallet_id VARCHAR(36) NOT NULL,
  principal BIGINT NOT NULL,
  total_due BIGINT NOT NULL,
  paid_amount BIGINT DEFAULT 0,
  status ENUM('DISBURSED','PARTIAL_PAID','PAID') DEFAULT 'DISBURSED',
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

SHOW TABLES;
SQL
```

Expected output:

```
+----------------------------+
| Tables_in_central_bank_core |
+----------------------------+
| audit_logs                 |
| idempotency_records        |
| loans                      |
| transactions               |
| users                      |
| wallet_accounts            |
| wallet_accounts_cache      |
+----------------------------+
```

---

## Langkah 5 — Jalankan 4 Services

Buka **4 tab terminal terpisah** (Laragon Terminal / Git Bash / VS Code Terminal). Jalankan **satu service per tab**, dan **jangan tutup tab** sampai selesai testing.

> **Urutan penting:** Central-Bank & Wallet butuh MySQL, jadi pastikan Laragon MySQL hijau dulu. Frontend & Gateway tidak butuh DB langsung.

### Tab 1 — Central-Bank (port 3000)

```bash
cd "C:/CODING/RPL 2/SmartBank/Central-Bank"
pnpm run start:dev
```

Tunggu sampai muncul:

```
[Nest] XXXX  - 06/18/2026, X:XX:XX PM     LOG [NestApplication] Nest application successfully started
Mapped {/api/v1/users/:id/wallet, GET} route
Mapped {/api/v1/wallets/me/balance, GET} route
...
Application is running on: http://localhost:3000/api/v1
```

### Tab 2 — Wallet (port 6969)

```bash
cd "C:/CODING/RPL 2/SmartBank/Wallet"
pnpm run dev
```

Tunggu sampai muncul banner:

```
✅ Wallet connected to MySQL successfully
🏦 SMARTBANK WALLET BACKEND - Tier-2 CBDC Provider
🟢 Server Status : ONLINE
🌐 Local URL    : http://localhost:6969
```

### Tab 3 — Gateway (port 4000)

```bash
cd "C:/CODING/RPL 2/SmartBank/Gateway"
pnpm run dev
```

Tunggu sampai:

```
🚀 API Gateway running on port 4000
```

### Tab 4 — Frontend (port 3001)

```bash
cd "C:/CODING/RPL 2/SmartBank/frontend"
pnpm run dev
```

Tunggu sampai:

```
▲ Next.js 16.x.x
- Local:        http://localhost:3001
✓ Ready in XXXms
```

---

## Langkah 6 — Smoke Test API

Buka **tab terminal ke-5** (atau pakai Postman / Insomnia).

### 6.1 Health Check Semua Service

```bash
echo "=== Central-Bank (port 3000) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api/v1/health

echo "=== Gateway (port 4000) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:4000/health

echo "=== Wallet (port 6969) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:6969/

echo "=== Frontend (port 3001) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3001
```

Semua harus **`HTTP 200`**.

### 6.2 E2E Test: Register → Login → Balance → Transaksi

**Register user baru** (user retail akan otomatis dapat wallet + saldo awal 50.000 CBDC):

```bash
curl -X POST http://localhost:4000/api/wallet/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Budi Santoso",
    "email":"budi@test.com",
    "phone":"+6281234567890",
    "password":"rahasia123",
    "pin":"123456"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "userId": "f10499bb-...",
    "name": "Budi Santoso",
    "email": "budi@test.com",
    "walletId": "144a54e5-...",
    "initialBalance": 50000,
    "role": "WALLET_USER"
  }
}
```

> **Catatan:** Format `phone` harus `+62xxx` (kode negara). Contoh: `+6281234567890`. Kalau pakai `08xxx` akan ditolak dengan error "Format nomor telepon tidak valid".

**Login** dan simpan token ke variabel:

```bash
TOK=$(curl -s -X POST http://localhost:4000/api/wallet/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@test.com","password":"rahasia123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token (first 50 chars): ${TOK:0:50}..."
```

**Cek saldo:**

```bash
curl -H "Authorization: Bearer $TOK" \
  http://localhost:4000/api/wallet/v1/wallets/me/balance
```

Expected:

```json
{
  "success": true,
  "data": {
    "wallet_id": "144a54e5-...",
    "currency": "CBDC_IDR",
    "available_balance": 50000,
    "hold_balance": 0
  }
}
```

**Cek riwayat transaksi:**

```bash
curl -H "Authorization: Bearer $TOK" \
  http://localhost:4000/api/wallet/v1/wallets/me/transactions
```

Expected: minimal 1 transaksi `INITIAL_DISTRIBUTION` sebesar 50.000 CBDC.

### 6.3 Test Service-Token Endpoint (verifikasi komunikasi Wallet ↔ Central-Bank)

```bash
# Endpoint service-to-service untuk lookup wallet by userId
curl -H "Authorization: [REDACTED]" \
  -H "X-Service-Name: WalletApp" \
  http://localhost:3000/api/v1/users/<USER_ID>/wallet
```

`<USER_ID>` ambil dari `data.userId` hasil register.

Expected:

```json
{
  "success": true,
  "data": {
    "user_id": "f10499bb-...",
    "wallet_id": "144a54e5-...",
    "currency": "CBDC_IDR",
    "available_balance": 50000,
    "hold_balance": 0
  }
}
```

### 6.4 Test Login Staff (Teller / Manager / Admin)

Staff tidak punya wallet customer, jadi login berhasil tapi **tidak bisa transaksi**:

```bash
# Teller
curl -X POST http://localhost:4000/api/wallet/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teller@test.com","password":"password"}'

# Manager
curl -X POST http://localhost:4000/api/wallet/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"password"}'

# Admin
curl -X POST http://localhost:4000/api/wallet/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password"}'
```

Expected: `success: true` dengan `role: TELLER` / `MANAGER` / `CENTRAL_BANK_ADMIN` (admin) dan `status: ACTIVE`.

### 6.5 Test Transfer P2P (opsional, butuh 2 user retail)

Daftarkan user kedua, lalu transfer dari user pertama ke user kedua:

```bash
# Register user kedua
curl -X POST http://localhost:4000/api/wallet/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Siti Aminah",
    "email":"siti@test.com",
    "phone":"+6289876543210",
    "password":"rahasia123",
    "pin":"654321"
  }'

# Login user kedua, simpan walletId
SITI_WALLET=$(curl -s -X POST http://localhost:4000/api/wallet/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"siti@test.com","password":"rahasia123"}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['data']['user']['walletId'])")

# Transfer dari Budi ke Siti (10.000 CBDC)
curl -X POST http://localhost:4000/api/wallet/v1/transfers \
  -H "Authorization: Bearer $TOK" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-tx-001" \
  -d "{
    \"to_wallet_id\":\"$SITI_WALLET\",
    \"amount\":10000,
    \"note\":\"Test transfer Budi ke Siti\"
  }"
```

Expected: status `SETTLED` dengan `gross_amount: 10000` plus fee (1.5%) + tax (2%).

---

## Langkah 7 — Akses Frontend

Buka browser:

```
http://localhost:3001
```

Anda akan melihat landing page **SmartBank CBDC Ecosystem** dengan kartu ATM 3D interaktif.

### Akun untuk Testing

| Role     | Email             | Password    | Wallet? | Bisa Transaksi? |
|----------|-------------------|-------------|---------|-----------------|
| Retail   | `budi@test.com`   | `rahasia123` | ✅ Ya (50.000 CBDC) | ✅ |
| Retail   | `siti@test.com`   | `rahasia123` | ✅ Ya (50.000 CBDC) | ✅ |
| Teller   | `teller@test.com` | `password`   | ❌ Tidak | ❌ (dashboard teller) |
| Manager  | `manager@test.com`| `password`   | ❌ Tidak | ❌ (dashboard manager) |
| Admin    | `admin@test.com`  | `password`   | ❌ Tidak | ❌ (dashboard admin) |

> **Login via UI:** klik tombol **Login** di landing page → masukkan email & password. Staff akan diarahkan ke dashboard sesuai role; retail akan diarahkan ke wallet.

---

## Troubleshooting

### ❌ MySQL "Access denied for user 'root'@'localhost' (using password: YES)"

Laragon default: `root` tanpa password. Cek:
```bash
mysql -u root -e "SELECT 1;"
```
Kalau butuh password, set di `Central-Bank/.env` → `DATABASE_URL=mysql://root:PASSWORD@127.0.0.1:3306/...` dan `Wallet/.env` → `DB_PASSWORD`.

### ❌ Wallet gagal konek MySQL setelah edit `.env`

Wallet pakai `dotenv` dengan path eksplisit ke `Wallet/.env`. Pastikan path benar. Cek `Wallet/src/config/config.js`:
```js
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
```

### ❌ "Unknown column 'phone' in 'field list'" saat seed staff

Schema Prisma sudah punya `phone` & `pin_hash` tapi migration belum diterapkan:
```bash
cd Central-Bank
npx prisma migrate deploy
```

### ❌ Gateway return 502 UPSTREAM_UNAVAILABLE (timeout 30s)

**Penyebab:** body parser (`express.json()`) jalan sebelum proxy → request body ke-drain. **Sudah diperbaiki** di `Gateway/server.js`. Pastikan edit sudah ter-apply (Gateway pakai `node --watch` jadi auto-reload).

### ❌ Login via Gateway return 404 "Rute tidak ditemukan"

**Penyebab:** `http-proxy-middleware@3` strip mount path sebelum `pathRewrite`. **Sudah diperbaiki** dengan callback form. Cek `Gateway/server.js` line ~107:
```js
pathRewrite: (path, req) => '/api' + path
```

### ❌ Login return 500 TypeError (getWalletByUserId is not a function)

**Sudah diperbaiki** dengan menambah:
- Endpoint `GET /api/v1/users/:id/wallet` di Central-Bank (`wallets.controller.ts`)
- Service token guard (`common/service-token.guard.ts`)
- Method `getWalletByUserId` di `Wallet/src/services/centralBank.service.js`

Pastikan Central-Bank sudah restart setelah edit.

### ❌ Frontend "next is not recognized"

```bash
cd frontend && pnpm install
```

### ❌ Frontend error "Multiple lockfiles"

Warning saja, tidak menggangu. Untuk silence, set di `frontend/next.config.ts`:
```ts
const nextConfig = { turbopack: { root: __dirname } };
```

### ❌ Port sudah dipakai (EADDRINUSE)

```bash
# Windows: cek process di port tertentu
netstat -ano | grep ":3000 " | grep LISTENING
# Kill PID
taskkill /F /PID <PID>
```

---

## Reset Environment

### Reset Database (hapus semua data, ulang dari nol)

```bash
mysql -u root -e "DROP DATABASE central_bank_core; CREATE DATABASE central_bank_core CHARACTER SET utf8mb4;"
cd "C:/CODING/RPL 2/SmartBank/Central-Bank"
npx prisma migrate deploy
node prisma/seed.js
```

### Reset Node Modules (kalau ada konflik dependency)

```bash
cd <service>
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Stop Semua Service

Di masing-masing tab terminal yang menjalankan service, tekan **Ctrl+C**.

Atau sekaligus (Windows):
```bash
taskkill /F /IM node.exe
```

> ⚠️ Perintah di atas mematikan **semua** proses Node.js, termasuk yang bukan SmartBank. Hati-hati kalau ada project lain jalan.

---

## Ringkasan Alur Startup

```
Laragon Start All (MySQL hijau)
      ↓
[Tab 1] cd Central-Bank && pnpm start:dev       (port 3000)
[Tab 2] cd Wallet       && pnpm dev             (port 6969)
[Tab 3] cd Gateway      && pnpm dev             (port 4000)
[Tab 4] cd frontend     && pnpm dev             (port 3001)
      ↓
[Tab 5] curl health checks (semua HTTP 200)
      ↓
Buka browser http://localhost:3001
      ↓
Login dengan budi@test.com / rahasia123
      ↓
Lihat saldo 50.000 CBDC & transaksi
```

---

**Dokumentasi ini dibuat untuk menjalankan SmartBank CBDC Ecosystem secara lokal tanpa Docker. Untuk testing otomatis, lihat `AUDIT_REPORT.md`.**
