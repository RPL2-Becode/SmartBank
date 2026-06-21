# SmartBank — Architecture & Bug Audit

Tanggal audit: 2026-06-18
Lingkup: `Central-Bank/` (NestJS), `Wallet/` (Express), `Gateway/` (Express proxy), `frontend/` (Next.js), `prisma/`, env & Docker.
Metode: pembacaan kode sumber + sub-agent audit paralel untuk Gateway/Wallet/Frontend.

## TL;DR

| Severity | Count |
|---|---|
| critical | 4 |
| high | 7 |
| medium | 7 |
| low | 11 |

**Top 5 wajib fix sebelum demo:**
1. **C4** Idempotency race → P2002 bocor jadi HTTP 500. (`Central-Bank/src/modules/idempotency/idempotency.service.ts:29-39`)
2. **C1** `.env` ter-commit dengan JWT_SECRET default → siapa pun bisa sign token `CENTRAL_BANK_ADMIN`. (lihat `Gateway/.env:2`, `Central-Bank/.env`)
3. **C2** Mock central-bank bisa aktif di runtime. (`Wallet/src/config/config.js:29`, `Wallet/src/services/centralBank.service.js`)
4. **H7** `teller.approveKyc` tidak whitelist `approvedRole` → MANAGER bisa escalate siapa pun ke role apapun via `as any` cast. (`Central-Bank/src/modules/teller/teller.service.ts:154-192`)
5. **H3** Idempotency record macet `PROCESSING` selamanya setelah crash → semua retry sah dapat 409. (`Central-Bank/src/modules/idempotency/idempotency.service.ts:37`)

## Arsitektur (validasi terhadap context)

```
Frontend (:3001) ──► Gateway (:4000) ─┬──► Central-Bank (:3000)  [NestJS, Prisma, MySQL]
                                       └──► Wallet (:6969)        [Express]
                                                    │
                                                    └──► MySQL (cache table)
                                                    └──► Central-Bank (semua mutasi saldo)
```

Two-tier CBDC **terjaga**: hanya Central-Bank yang menulis `WalletAccount.availableBalance`. Wallet hanya cache (`wallet_accounts_cache`) yang disinkronkan setelah settlement. Context compliance OK.

**Strength arsitektur:**
- BigInt untuk uang (no float, presisi 100%).
- Atomic settlement via `prisma.$transaction`.
- `SELECT ... FOR UPDATE` dengan sort ID → deadlock prevention.
- Idempotency `(key, route, actorId)` unique constraint.
- Append-only ledger; reversal = new transaction, never delete.
- Cooldown + daily limit enforced server-side.
- Role-based access pakai `RolesGuard` yang **hanya** baca `request.user.role` dari JWT (header `x-user-role` dari Gateway di-strip di line 67-69, dan di-cast `as any` di Central-Bank abaikan). Good.
- Money supply invariant di-read-side: `reserve + circulating + sink == total_supply`. (`monetary-policy.service.ts:22-23`)
- Deadlock retry 3× dengan exponential backoff.
- Audit log untuk admin/financial action.

---

## CRITICAL

### C1 — `.env` dengan JWT_SECRET default ter-commit
**Bukti:** `Gateway/.env:2` `JWT_SECRET=supersecretkey_change_me_2026`; `Central-Bank/.env` `JWT_SECRET=change-me-for-development`. Default di `Central-Bank/.env.example` & `Wallet/src/config/config.js:13` `change-me-for-development`.
**Dampak:** Siapa pun yang clone repo bisa sign JWT `role: 'CENTRAL_BANK_ADMIN'` → akses `/api/v1/central-bank/*` (supply, ledger, reversals).
**Fix:**
1. Rotate `JWT_SECRET` di production.
2. Hapus file `.env` dari git history (`git filter-repo`).
3. Tambah `JWT_SECRET` ke `.gitignore` (cek: `C:\CODING\RPL 2\SmartBank\.gitignore` belum cover subdir `.env`).
4. Hard-fail startup jika `JWT_SECRET === 'change-me-for-development' || length < 32` di semua 3 service.

### C2 — Mock central-bank tanpa safety net
**Bukti:** `Wallet/src/config/config.js:29` `mock: process.env.MOCK_CENTRAL_BANK === 'true'`. Branches mock di `Wallet/src/services/centralBank.service.js` (cari pattern `if (config.centralBank.mock)` — sub-agent menemukan 9 lokasi).
**Dampak:** Salah tulis env `MOCK_CENTRAL_BANK=true` di staging/prod → semua saldo hidup di memori Node, restart = data loss, **tidak ada ledger entry sama sekali** di Central-Bank DB.
**Fix:**
```js
// Wallet/src/app.js atau server.js, sebelum listen()
if (config.centralBank.mock && process.env.NODE_ENV === 'production') {
  throw new Error('MOCK_CENTRAL_BANK must be false in production');
}
```
Atau: hapus mock branch dari build (kompilasi terpisah `wallet-mock.js` untuk dev-only).

### C3 — Role bisnis di Wallet tidak ada di enum Central-Bank
**Bukti:** `Wallet/src/controllers/wallet.controller.js:282` `validRoles = ['MERCHANT', 'CASHIER', 'SUPPLIER', 'LOGISTICS', 'ANALYTICS_VIEWER']`. Tapi `prisma/schema.prisma:10-18` `UserRole` hanya: `WALLET_USER, MERCHANT, CENTRAL_BANK_ADMIN, AUDITOR, SYSTEM_SERVICE, MANAGER, TELLER`. `CASHIER`, `SUPPLIER`, `LOGISTICS`, `ANALYTICS_VIEWER` tidak ada. Sub-agent menemukan mapping internal fallback ke `MERCHANT` untuk role yang tidak dikenal.
**Dampak:** Backend menerima role `CASHIER` → simpan sebagai `MERCHANT` (drift). Audit log bisa berisi role string yang tidak dikenal. Inkonsistensi laporan.
**Fix:**
- Sinkronkan `UserRole` enum di Central-Bank dengan role bisnis (tambah `CASHIER`, `SUPPLIER`, `LOGISTICS`, `ANALYTICS_VIEWER` ke Prisma), atau
- Hapus role di luar enum dari `validRoles` di Wallet.
- Buat shared package `packages/auth` dengan konstanta `UserRole` agar tidak drift.

### C4 — Idempotency race: P2002 bocor ke HTTP 500
**Bukti:** `Central-Bank/src/modules/idempotency/idempotency.service.ts:13-39`
```ts
const existing = await tx.idempotencyKey.findUnique({ ... });
if (existing) { ... }
await tx.idempotencyKey.create({ ... });  // line 29
```
Unique constraint: `prisma/schema.prisma:315` `@@unique([idempotencyKey, route, actorId])`. Tidak ada `try/catch` di seluruh codebase untuk `P2002`.
**Dampak:** Dua request konkuren dengan key+route+actorId sama → keduanya lewat `findUnique` (read snapshot) → keduanya `create` → request kedua dapat `PrismaClientKnownRequestError P2002` → `http-error.filter.ts` translate ke 500 `DATABASE_TRANSACTION_FAILED`. Klien tidak bisa retry aman.
**Fix:**
```ts
async start(tx, input) {
  const existing = await tx.idempotencyKey.findUnique({ where: { ... } });
  if (existing) {
    if (existing.requestHash !== input.requestHash) throw new AppError(ErrorCode.IDEMPOTENCY_CONFLICT, '...');
    if (existing.status === 'COMPLETED') return { replay: true, response: existing.responseBody };
    if (existing.status === 'PROCESSING' && existing.lockedUntil && existing.lockedUntil < new Date()) {
      // stale, allow reclaim
      await tx.idempotencyKey.update({ where: { idempotencyKey_route_actorId: { ... } },
        data: { lockedUntil: new Date(Date.now() + 60_000) } });
      return { replay: false };
    }
    throw new AppError(ErrorCode.IDEMPOTENCY_CONFLICT, 'Request masih diproses');
  }
  try {
    await tx.idempotencyKey.create({ data: { ... } });
  } catch (e) {
    if (e?.code === 'P2002') {
      // Race: re-read existing and return appropriate result
      const reRead = await tx.idempotencyKey.findUnique({ where: { ... } });
      if (reRead?.status === 'COMPLETED' && reRead.requestHash === input.requestHash) {
        return { replay: true, response: reRead.responseBody };
      }
      throw new AppError(ErrorCode.IDEMPOTENCY_CONFLICT, 'Concurrent request dengan key yang sama');
    }
    throw e;
  }
  return { replay: false };
}
```
Tambah juga `PrismaClientExceptionFilter` global (lihat H5).

---

## HIGH

### H1 — Symmetric JWT secret antar service = trust collapse
**Bukti:** `Gateway/server.js:10-12`, `Wallet/src/config/config.js:4-5`, `Central-Bank/src/modules/auth/auth.module.ts:16-17` semua load `JWT_SECRET` dari env, **satu secret yang sama**.
**Dampak:** RCE di salah satu service = kompromi semua. Service mana pun bisa mint token `role: 'CENTRAL_BANK_ADMIN'`.
**Fix:** Asymmetric RS256. Central-Bank sign dengan private key, Gateway & Wallet verify dengan public key. Service-to-service pakai service-account token (issuer berbeda, audience berbeda).

### H2 — Token di `localStorage` (XSS-readable)
**Bukti:** `frontend/src/store/auth.ts:31-36` `localStorage.getItem('cbdc_token')` & `setItem('cbdc_token', token)`.
**Dampak:** Single XSS = token theft → impersonate user termasuk admin.
**Fix:**
- Pindah token ke `httpOnly; Secure; SameSite=Strict` cookie (Backend set cookie di response login, frontend tidak akses via JS).
- Set `Content-Security-Policy` strict di `next.config.js` `headers()`.
- Tambah `helmet()` di Wallet (`app.js:39` belum di-mount).

### H3 — Idempotency lock macet selamanya (stuck PROCESSING)
**Bukti:** `Central-Bank/src/modules/idempotency/idempotency.service.ts:37` `lockedUntil: new Date(Date.now() + 60_000)`. Tidak ada background job yang reset. `start()` line 27 throw "masih diproses" tanpa cek `lockedUntil`.
**Dampak:** Worker crash / DB error → idempotency key macet 60s+ → semua retry dari client sah dapat 409 permanen sampai intervensi manual (delete row).
**Fix:**
1. Modifikasi `start()` (lihat C4 fix di atas — reclaim jika `lockedUntil < now`).
2. Opsional: cron job `UPDATE idempotency_keys SET status='FAILED' WHERE status='PROCESSING' AND lockedUntil < NOW()`.

### H4 — `approvedRole` tanpa whitelist
**Bukti:** `Central-Bank/src/modules/teller/teller.service.ts:154-192` `role: input.approvedRole as any`. Validasi hanya `user.pendingRole !== input.approvedRole` (line 168), bukan enum check.
**Dampak:** MANAGER bisa set `approvedRole: 'CENTRAL_BANK_ADMIN'` jika user sudah punya `pendingRole: 'CENTRAL_BANK_ADMIN'` di DB. Atau, jika attacker jadi MANAGER (via stolen token H1/H2), escalate role apapun.
**Fix:**
```ts
const ALLOWED_UPGRADE_ROLES = new Set(['MERCHANT', 'TELLER', 'MANAGER'] as const);
if (!ALLOWED_UPGRADE_ROLES.has(input.approvedRole as any)) {
  throw new AppError(ErrorCode.FORBIDDEN, 'Role tidak dapat di-upgrade via API');
}
```
Provisioning `CENTRAL_BANK_ADMIN`, `AUDITOR`, `SYSTEM_SERVICE` harus manual via DB seed, tidak via API.

### H5 — Prisma error tidak di-translate
**Bukti:** `Central-Bank/src/common/http-error.filter.ts:15` `code = typed.code ?? ErrorCode.DATABASE_TRANSACTION_FAILED`. Tidak ada handler untuk `P2002`, `P2025`, `P2034`.
**Dampak:** Unique violation / not-found / deadlock semua jadi 500 ke client.
**Fix:** Tambah `PrismaClientExceptionFilter` (Nest pattern: extend `BaseExceptionFilter`):
```ts
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const status = {
      P2002: HttpStatus.CONFLICT,
      P2025: HttpStatus.NOT_FOUND,
      P2034: HttpStatus.SERVICE_UNAVAILABLE,
    }[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    // ... emit envelope
  }
}
```

### H6 — `getSupply()` race window
**Bukti:** `Central-Bank/src/modules/central-bank/monetary-policy.service.ts:12-22` — 3 read sequential di luar `prisma.$transaction`.
**Dampak:** Jika settlement konkuren, `invariantTotal !== totalSupply` → false positive "supply invariant tidak valid" → HTTP 500 ke admin padahal sistem balanced.
**Fix:** Bungkus dalam `$transaction(async tx => ...)` untuk konsistensi read.

### H7 — `lockAccounts` sort OK, tapi `tx.$queryRaw` tanpa timeout bisa gantung
**Bukti:** `Central-Bank/src/modules/settlement/settlement.service.ts:66,553,635` `tx.$queryRaw(SELECT ... FOR UPDATE)` tanpa `set innodb_lock_wait_timeout`. Plus di `app.module.ts` tidak ada `pool` config Prisma.
**Dampak:** Connection pool habis saat deadlock chain → semua request hang. Plus default MySQL `innodb_lock_wait_timeout=50s` → user tunggu 50s sebelum 500.
**Fix:**
```ts
// prisma/schema.prisma generator atau .env
DATABASE_URL="mysql://...?connection_limit=20&socket_timeout=10"
// settlement.service.ts:66
await tx.$queryRaw(Prisma.sql`SET innodb_lock_wait_timeout = 5`);
await tx.$queryRaw(Prisma.sql`SELECT id FROM wallet_accounts ... FOR UPDATE`);
```

---

## MEDIUM

### M1 — Supply cap tidak di-enforce di settlement path
**Bukti:** `monetary-policy.service.ts:23` cek cap hanya read-side. `settleInitialDistribution` (line 145-209) cek `already + initialBalance > maxInitial` → return 0 tanpa throw (line 167-170). Bisa silent zero-distribution.
**Fix:** Throw `SUPPLY_INVARIANT_VIOLATION` jika `already + initialBalance > maxInitial` di registration.

### M2 — Rate limit fixed-window, in-memory, IP-spoofable
**Bukti:** `Gateway/middleware/security.js:42-65` Map in-memory. `Gateway/server.js:46` `app.set('trust proxy', process.env.TRUST_PROXY === 'true')`.
**Dampak:** Restart = counter reset. Multi-instance = limit × N. `TRUST_PROXY=true` + `X-Forwarded-For` rotation = bypass.
**Fix:** Pakai Redis-backed limiter, atau set `trust proxy` ke subnet spesifik (`'loopback, linklocal, uniquelocal'`). Sliding window log lebih akurat.

### M3 — `MONGO-style $1 placeholder translator` di Wallet
**Bukti:** `Wallet/src/config/database.js:103-114` — string detection toggle hanya single quote `'`, tidak handle MySQL double-quoted strings atau escape sequence.
**Dampak:** SQL injection teoretis via `'$1'` di dalam string escaped. Belum ditemukan exploit langsung tapi fragile.
**Fix:** Hapus translator, pakai `mysql2` native `?` placeholders. Refactor semua query pakai `pool.query(sql, [param1, param2])`.

### M4 — `supply` & `ledger` read-only tidak untuk AUDITOR
**Bukti:** `Central-Bank/src/modules/central-bank/central-bank.controller.ts:12` `@Roles(UserRole.CENTRAL_BANK_ADMIN)`. `AUDITOR` ada di enum tapi tidak boleh akses.
**Fix:** `@Roles(UserRole.CENTRAL_BANK_ADMIN, UserRole.AUDITOR)` di method `supply()` & `ledger()`.

### M5 — Public route set di Gateway tanpa `/health`
**Dampak:** External monitor tidak bisa ping tanpa token.
**Fix:** Tambah `/health` ke `publicRoutes`. Sebenarnya di-handle di `server.js:109` (di luar proxy) jadi OK, tapi konsisten.

### M6 — `pathRewrite` tidak normalisasi
**Bukti:** `Gateway/server.js:89-91,103-105` rewrite string. `/api/bank/../central-bank/admin` setelah rewrite jadi `/api/v1/../central-bank/admin` — `http-proxy-middleware` tidak validate.
**Fix:** Tambah `pathFilter: ['/api/bank/**', '/api/wallet/**']` di `createProxyMiddleware`. Defense-in-depth.

### M7 — Frontend `useAuthStore.getState()` di fetchApi (luar React)
**Bukti:** `frontend/src/lib/api.ts:36` — coupling API ↔ auth.
**Fix:** Inject token via parameter atau context.

---

## LOW (sampel, full list di appendix)

- **L1** — `wallet_accounts_cache` bisa drift, no reconciliation job. Tambah cron daily.
- **L2** — PIN plain-text di header/body, hanya HTTPS yang proteksi. (Acceptable untuk prototype.)
- **L3** — `trust proxy` di Wallet & Gateway tanpa scope. Set ke `'loopback'`.
- **L4** — Wallet tidak mount `helmet()`. Tambah `app.use(helmet())`.
- **L5** — `SENSITIVE_KEYS` di Central-Bank tidak cover `refresh_token` (snake_case). Tambah.
- **L6** — `Vary: Origin` double-set di Gateway (cors + manual). Hapus salah satu.
- **L7** — `isDeadlock()` brittle (string match). Cek numeric code `1213`/`1205`.
- **L8** — `MonetaryPolicyService.supply()` return BigInt. Konfirmasi `api-response.interceptor.ts:7-9` sudah normalize → string. **(Verified OK dari interceptor)**
- **L9** — `requestHash` topUp/withdraw tidak include `reasonCode`. Acceptable.
- **L10** — `Idempotency-Key` di-generate client-side random, hilang saat refresh. Pakai sessionStorage.
- **L11** — `CASHIER`/`LOGISTICS`/`SUPPLIER` di `validRoles` Wallet tapi tidak di-handle mapping → fallback `WALLET_USER`. (Sudah dibahas C3.)

---

## Verifikasi non-issue (jawaban eksplisit)

| Pertanyaan | Status | Bukti |
|---|---|---|
| Apakah ada trust header `x-user-role` di backend? | **TIDAK** | `roles.guard.ts:26` hanya baca `request.user.role` dari JWT. Gateway set header line 44-45 tapi backend abaikan. Komentar eksplisit. |
| Mutasi saldo langsung di Wallet? | **TIDAK** (kecuali mock) | `Wallet/src/services/centralBank.service.js` mock branch mutasi memori, production route ke Central-Bank. |
| Ledger append-only? | **YA** | `LedgerService.post` hanya `createMany`, tidak ada `update`/`delete` di seluruh codebase untuk `ledger_entries`. |
| Cooldown + daily limit? | **YA** | `SettlementService.enforceVelocityLimits` di setiap transfer/payment-request pay. |
| `lockAccounts` sort untuk deadlock prevention? | **YA** | `settlement.service.ts:64` `[...new Set(accountIds)].sort()` lalu `ORDER BY id FOR UPDATE`. |
| BigInt untuk uang? | **YA** | `BigInt` di seluruh `money.service.ts`, `prisma.schema.prisma` pakai `BigInt`. |
| Idempotency-Key wajib? | **YA** | `requireIdempotencyKey` di semua POST finansial. `IDEMPOTENCY_KEY_REQUIRED` 400 jika tidak ada. |
| Reason code untuk admin actions? | **YA** | `audit.record` punya `reasonCode` di suspend, activate, KYC verify, reversal, top-up, withdraw. |
| Frontend hardcoded balance? | **TIDAK** | Balance dari API. |
| Frontend tampilkan PENDING sebagai SETTLED? | **TIDAK** | Status mentah dari API. |
| Ledger imbalance prevention? | **YA** | `LedgerService.validate` di setiap `post()`. |

---

# Cara Menjalankan Tanpa Docker (Laragon Lokal)

**Prasyarat (Laragon):**
- MySQL aktif di `127.0.0.1:3306` (default Laragon user `root` password kosong, atau sesuai setting Anda).
- Node.js ≥ 20.x.
- Database dibuat manual: `central_bank_core` (dipakai Central-Bank **dan** Wallet cache, lihat `Wallet/database/schema.sql` apakah perlu DB terpisah).

## Step 1 — Root `.env` (Laragon)
Edit `C:\CODING\RPL 2\SmartBank\.env`:
```env
# Laragon MySQL (sesuaikan password)
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=central_bank_core
MYSQL_USER=root
MYSQL_PASSWORD=

# Harus sama untuk semua service (shared secret = shared trust)
JWT_SECRET=ganti_dengan_random_string_min_32_karakter_abcdef123456
JWT_ISSUER=smartbank
JWT_AUDIENCE=smartbank-clients
ENABLE_STAFF_SEED=true
```

Buat database di Laragon (HeidiSQL atau mysql CLI):
```sql
CREATE DATABASE central_bank_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Step 2 — Copy `.env` ke tiap service + override host
Buka terminal di root project:
```bash
# PowerShell
Copy-Item .env Central-Bank\.env
Copy-Item .env Wallet\.env
Copy-Item .env Gateway\.env
Set-Content frontend\.env.local "NEXT_PUBLIC_API_BASE_URL=http://localhost:4000"
```

Edit masing-masing `.env` untuk arahkan ke `localhost` (bukan nama container):
- `Central-Bank\.env` — tambahkan:
  ```env
  DATABASE_URL="mysql://root:@127.0.0.1:3306/central_bank_core"
  ```
  (hapus override `mysql:` di docker compose; Prisma akan baca `DATABASE_URL`.)
- `Wallet\.env` — tambahkan:
  ```env
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=central_bank_core
  USE_IN_MEMORY_DB=false
  CENTRAL_BANK_CORE_URL=http://localhost:3000
  MOCK_CENTRAL_BANK=false
  ```
- `Gateway\.env`:
  ```env
  CENTRAL_BANK_URL=http://localhost:3000
  WALLET_URL=http://localhost:6969
  TRUST_PROXY=false
  ```

## Step 3 — Install dependencies
```bash
cd "C:/CODING/RPL 2/SmartBank"
npm install                              # root (installs concurrently)
npm --prefix Central-Bank install
npm --prefix Wallet install
npm --prefix Gateway install
cd frontend && npm install && cd ..
```

## Step 4 — Prisma migrate + seed (Central-Bank)
```bash
cd Central-Bank
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
cd ..
```
Seed membuat:
- 12 system accounts (CENTRAL_RESERVE = 1.000.000.000, FEE_*, TAX_SINK, LOAN_POOL_ACCOUNT, dst).
- 1 INITIAL_SUPPLY monetary policy event.
- 1 LOAN_POOL_FUNDING (10.000.000 dari reserve ke loan pool).
- 7 fee rules (BANK 100bps, GATEWAY 50bps, TAX 200bps, MARKETPLACE 200bps, POS 100bps, SUPPLIER 300bps, LOGISTICS flat 5000).

## Step 5 — Setup Wallet DB schema (jika pakai cache table)
Periksa `Wallet/src/database/schema.sql`. Jika berisi `CREATE TABLE wallet_accounts_cache`, jalankan manual:
```bash
mysql -u root -p central_bank_core < Wallet/src/database/schema.sql
```
(Jika Laragon user `root` tanpa password: `mysql -u root central_bank_core < ...`.)

## Step 6 — Jalankan 4 service
Opsi A: 1 terminal, semua service paralel:
```bash
cd "C:/CODING/RPL 2/SmartBank"
npm run start:local
```
(Opsi `start:local` di root `package.json:13` menjalankan CB + Wallet + Gateway + CB-UI via `concurrently`.)

Opsi B: 4 terminal terpisah (lebih mudah debug):
```bash
# Terminal 1 — Central-Bank
cd Central-Bank && npm run start:dev

# Terminal 2 — Wallet
cd Wallet && npm run dev

# Terminal 3 — Gateway
cd Gateway && npm run dev

# Terminal 4 — Frontend
cd frontend && npm run dev
```

## Step 7 — Verifikasi
```bash
# Health check
curl http://localhost:4000/health
curl http://localhost:3000/api/v1/health
curl http://localhost:6969/

# Frontend
# Browser: http://localhost:3001
# Swagger Wallet: http://localhost:6969/api-docs
# E2E test: node e2e-test.js
```

Akun staff otomatis ter-seed (jika `ENABLE_STAFF_SEED=true`):
- `teller@test.com` / `password` / PIN `123456`
- `manager@test.com` / `password` / PIN `123456`
- `admin@test.com` / `password` / PIN `123456`

## Troubleshooting umum (Laragon)

| Masalah | Solusi |
|---|---|
| `PrismaClientInitializationError: Access denied` | Cek user/password di `Central-Bank\.env` `DATABASE_URL`. |
| `ECONNREFUSED 127.0.0.1:3000` saat Wallet start | Central-Bank belum up. Tunggu 30s setelah `start:dev`. |
| `CORS: Origin not allowed` dari frontend | Tambah `http://localhost:3001` ke `CORS_ALLOWED_ORIGINS` di `Central-Bank\.env` (default sudah ada, cek) **dan** `Gateway\.env`. |
| `Cannot find module '@prisma/client'` | Jalankan `npm --prefix Central-Bank run prisma:generate`. |
| `Port 3306 already in use` | Laragon MySQL konflik. Stop service MySQL Windows atau ganti port. |
| Port `4000/3000/6969/3001` dipakai | Ganti di `Gateway\.env` `PORT`, `Central-Bank\.env` `PORT`, `Wallet\.env` `PORT`, `frontend/.env.local`. |
| Idempotency error setelah restart | Normal — restart hapus idempotency key cache di Central-Bank (DB persist OK), tapi stale `PROCESSING` lock bisa menggantung — fix via H3. |
| `bigint` JSON error di response | Sudah di-handle `api-response.interceptor.ts:7-9` (verified). |

---

## Ringkasan tindakan

| Priority | Aksi | File | Effort |
|---|---|---|---|
| P0 | Fix idempotency race (C4) | `Central-Bank/src/modules/idempotency/idempotency.service.ts` | 1h |
| P0 | Whitelist `approvedRole` (H4) | `Central-Bank/src/modules/teller/teller.service.ts:154` | 15m |
| P0 | Hapus `.env` dari git, rotate secret (C1) | repo-wide | 30m |
| P0 | Guard `MOCK_CENTRAL_BANK` di production (C2) | `Wallet/src/app.js` startup | 15m |
| P0 | Sinkronkan `UserRole` enum (C3) | `Central-Bank/prisma/schema.prisma` + `Wallet` `validRoles` | 1h + migration |
| P1 | Tambah Prisma exception filter (H5) | `Central-Bank/src/common/prisma-exception.filter.ts` | 30m |
| P1 | Idempotency reclaim + cleanup (H3) | `idempotency.service.ts` | 1h |
| P1 | Bungkus `getSupply()` dalam transaction (H6) | `monetary-policy.service.ts:10` | 15m |
| P2 | Asymmetric JWT (H1) | 3 service config + token.service | 4h |
| P2 | httpOnly cookie token (H2) | `auth.service.ts` login + `frontend` store | 2h |
| P2 | Helmet + rate limit Redis (M2/L4) | `Wallet/src/app.js`, deps | 2h |
| P3 | Reject `CASHIER/LOGISTICS/SUPPLIER/ANALYTICS_VIEWER` (L11) | `Wallet` `validRoles` | 5m |
| P3 | Remove `$1` placeholder translator (M3) | `Wallet/src/config/database.js` | 1h |
| P3 | Tambah `AUDITOR` ke supply/ledger read (M4) | `central-bank.controller.ts:12` | 5m |

Total estimasi fix P0+P1: ~6 jam kerja. P2-P3: ~10 jam.
