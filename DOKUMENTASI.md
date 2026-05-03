# Dokumentasi Implementasi SmartBank Web

Tanggal implementasi: 2026-05-03  
Stack: React 19, Vite, TypeScript, CSS custom, lucide-react  
Target backend: `VITE_API_BASE_URL=http://localhost:3000/api/v1`

## Ringkasan

Implementasi ini merealisasikan MVP frontend berdasarkan `implementation_plan.md` dalam bentuk portal operasional SmartBank Payment Gateway. Fokus utama adalah demo end-to-end untuk role user, merchant, admin, developer, dan analytics viewer dengan route guard, tampilan finansial, fee breakdown, idempotency key, status transaksi, receipt, ledger, webhook, dan rekonsiliasi.

Frontend belum menjadi trusted system. Semua perhitungan final saldo, fee, limit, dan ledger tetap diasumsikan milik backend SmartBank. Data yang ada di aplikasi adalah mock state untuk kebutuhan demo lokal.

## File Utama

- `src/App.tsx`: routing, state demo, role guard, layout, halaman, tabel, form transfer/payment, admin/developer/analytics views.
- `src/styles.css`: desain visual responsif, app shell, tabel, form, badge status, receipt, dashboard cards.
- `src/main.tsx`: entry React.
- `.env.example`: konfigurasi base URL API dan Swagger.
- `package.json`: script dev/build dan dependency frontend.

## Fitur yang Diimplementasikan

### Public dan Auth

- Landing page SmartBank.
- Login demo dengan pemilihan role.
- Register demo user.
- Unauthorized page (`/403`) dan not found (`/404`).
- Session demo disimpan di `localStorage` sebagai profil role.

### User Wallet

- Dashboard user dengan saldo, transaksi, pending status, dan daily limit.
- Balance page dengan account code dan token internal masked.
- Transaction list dan transaction detail/receipt.
- Transfer flow input, preview fee, idempotency key, konfirmasi, result.
- Payment request flow dengan source app, channel, debtor, creditor, JSON preview, fee breakdown, idempotency key.
- Loans, apply loan, subscription mandate, dan SmartQR pay.

### Merchant dan Supplier

- Merchant dashboard.
- Incoming payments.
- SmartQR create dan SmartQR list.
- Settlement history.
- Fee summary.
- Supplier memakai akses merchant dashboard dan incoming payments.

### Admin SmartBank

- Admin dashboard untuk money supply, reserve, success rate, webhook retry.
- Accounts.
- Ledger debit/kredit.
- Payment requests.
- Transactions.
- Fee rules editable.
- Money supply visualization.
- Loan monitor.
- Applications.
- Webhook deliveries dengan retry action.
- Audit logs.
- Reconciliation debit/kredit.

### Developer / Integrator

- Developer dashboard.
- API clients.
- Test payment.
- Idempotency inspector.
- Webhook endpoints.
- Webhook test payload.
- Swagger docs link/iframe melalui `VITE_SWAGGER_URL`.

### Analytics Viewer

- UMKM Insight dashboard read-only.
- Sales analytics.
- Cashflow analytics.
- Fee analytics.
- Export report list.

## Route Penting

| Area | Route |
|---|---|
| Public | `/`, `/auth/login`, `/auth/register` |
| User | `/dashboard`, `/wallet/balance`, `/wallet/transactions`, `/wallet/transfer`, `/payments/new` |
| Merchant | `/merchant/dashboard`, `/merchant/payments`, `/merchant/smartqr/create`, `/merchant/settlements` |
| Admin | `/admin`, `/admin/accounts`, `/admin/ledger`, `/admin/fee-rules`, `/admin/reconciliation` |
| Developer | `/developer`, `/developer/test-payment`, `/developer/idempotency`, `/developer/api-docs` |
| Analytics | `/analytics/dashboard`, `/analytics/sales`, `/analytics/cashflow`, `/analytics/fees` |

## Prinsip Keamanan yang Diterapkan

- Tidak ada client secret di source frontend.
- Idempotency key dibuat di browser untuk transaksi mutasi.
- UI menampilkan peringatan bahwa HMAC produksi harus dibuat server-side/BFF.
- Route guard membatasi halaman berdasarkan role.
- Account token ditampilkan dalam bentuk masked.
- Error transaksi gagal tidak mengubah ledger mock.

## Batasan Saat Ini

- API backend belum dipanggil secara nyata; data masih mock di state React.
- Route guard frontend hanya UX guard, backend tetap wajib validasi authorization.
- Build sudah sukses, tetapi verifikasi visual browser belum mencakup automated E2E.
- Swagger iframe bergantung pada backend yang berjalan di URL environment.

## Cara Verifikasi

```bash
npm install
npm run build
npm run dev
```

Flow demo yang disarankan:

1. Login sebagai User.
2. Buka dashboard, balance, dan transaksi.
3. Jalankan transfer dengan preview fee dan konfirmasi.
4. Buat payment request dan lihat JSON preview.
5. Login sebagai Admin, buka ledger dan reconciliation.
6. Login sebagai Developer, buka test payment dan Swagger docs.
7. Login sebagai Merchant, buat SmartQR.
8. Login sebagai Analytics Viewer, lihat dashboard read-only.

## Hasil Build

Perintah `npm run build` berhasil pada 2026-05-03. Output produksi dibuat di `dist/` dan tidak dimasukkan ke git karena dapat digenerate ulang.

## Rekomendasi Lanjutan

- Pisahkan `src/App.tsx` menjadi modul `features`, `components`, `api`, dan `lib` sesuai struktur di `implementation_plan.md`.
- Ganti mock state dengan API client typed dari OpenAPI/Swagger.
- Tambahkan React Query untuk server state saat backend tersedia.
- Tambahkan React Hook Form + Zod untuk validasi form transaksi.
- Tambahkan test unit untuk money formatter, fee breakdown, status badge, route guard, dan idempotency hook.
- Tambahkan E2E Playwright untuk register-login-transfer-payment-admin-ledger.
