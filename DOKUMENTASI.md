# Dokumentasi Implementasi SmartBank Web

Tanggal implementasi: 2026-05-03  
Stack: React 19, Vite, TypeScript, CSS custom, lucide-react  
Target backend tetap dikonfigurasi lewat environment, tetapi URL teknis tidak ditampilkan pada UI.

## Arah Visual

Redesign terbaru memakai arah **Clean Bento Banking Dashboard**: aplikasi langsung masuk ke login/register lalu dashboard, tanpa landing page. Dashboard utama memakai background gelap profesional, sidebar berlabel yang dapat membuka section informasi, bento grid 12 kolom, panel saldo besar dengan grafik, kartu aktif, transaksi terbaru, insight role, aksi cepat, investasi, dan kontrol sistem.

Landing page dihapus dari flow utama. Route `/` langsung membuka login/register, lalu pengguna masuk ke dashboard. Role disederhanakan menjadi 4 role bank: Nasabah Individu, Teller Cabang, Operasional Bank, dan Manajer / Approver.

## Ringkasan

Implementasi terbaru memprioritaskan tampilan frontend terlebih dahulu dalam bentuk portal bank profesional. Fokus utama adalah flow login/register dan dashboard untuk empat role bank nyata: nasabah, teller, operasional, dan manajer/approver.

Frontend belum menjadi trusted system. Semua perhitungan final saldo, fee, limit, dan ledger tetap diasumsikan milik backend SmartBank. Data yang ada di aplikasi adalah mock state untuk kebutuhan demo lokal.

## File Utama

- `src/App.tsx`: routing, state demo, role guard, layout auth, register, dan dashboard role-based.
- `src/styles.css`: desain visual responsif, auth card-only, dashboard bento dark mode, sidebar navigasi, kartu, chart, motion, form, badge status, dan komponen dasar.
- `src/main.tsx`: entry React.
- `.env.example`: konfigurasi base URL API dan Swagger.
- `package.json`: script dev/build dan dependency frontend.

## Fitur yang Diimplementasikan

### Public dan Auth

- Tidak ada landing page; `/` langsung menampilkan login.
- Login demo dengan pemilihan role, field email/password, validasi dasar, kredensial demo, dan redirect sesuai role.
- Register demo untuk empat role bank dengan validasi nama, email, password, persetujuan prinsip backend-trusted, pembuatan account mock, dan auto-login.
- Tampilan login/register memakai satu card utama yang terpusat, tanpa panel samping, agar flow masuk lebih sederhana.
- Unauthorized page (`/403`) dan not found (`/404`).
- Session demo disimpan di `localStorage` sebagai profil role.

### Dashboard Empat Role

- Nasabah Individu: total saldo, kartu aktif, transaksi terbaru, dan ringkasan investasi.
- Teller Cabang: volume counter, kartu kerja teller, aktivitas masuk, dan status layanan.
- Operasional Bank: rasio settlement, kartu settlement desk, dan aktivitas operasional.
- Manajer / Approver: posisi reserve, kartu executive, dan ringkasan transaksi penting.
- Sidebar dashboard berisi navigasi Overview, Rekening, Transaksi, Kartu, Insight, dan Kontrol. Setiap item mengarah ke bento section terkait.

## Perubahan Copy dan Informasi Teknis

- Label URL API seperti `http://localhost:3000/api/v1` tidak lagi muncul di header atau dashboard.
- Label teknis di halaman saldo diganti menjadi `Core banking service`.
- Copy dashboard dibuat lebih singkat, natural, dan fokus pada istilah perbankan.

## Route Penting

| Area | Route |
|---|---|
| Public | `/`, `/auth/login`, `/auth/register` |
| Dashboard | `/dashboard` |

## Prinsip Keamanan yang Diterapkan

- Tidak ada client secret di source frontend.
- Frontend tidak menyimpan secret produksi.
- UI menampilkan peringatan bahwa otorisasi final tetap berada di backend.
- Route guard membatasi halaman berdasarkan role.
- Account token ditampilkan dalam bentuk masked.
- Error transaksi gagal tidak mengubah ledger mock.

## Batasan Saat Ini

- API backend belum dipanggil secara nyata; data masih mock di state React.
- Route guard frontend hanya UX guard, backend tetap wajib validasi authorization.
- Build sudah sukses, tetapi verifikasi visual browser belum mencakup automated E2E.
- Fokus saat ini adalah desain frontend; halaman transaksi/detail lama tidak menjadi navigasi utama.

## Cara Verifikasi

```bash
npm install
npm run build
npm run dev
```

Flow demo yang disarankan:

1. Buka `/` dan pastikan langsung tampil login.
2. Login sebagai Nasabah Individu dan cek dashboard.
3. Logout, lalu login sebagai Teller Cabang.
4. Ulangi untuk Operasional Bank dan Manajer / Approver.
5. Buka `/auth/register` dan coba register role baru.

## Hasil Build

Perintah `npm run build` berhasil pada 2026-05-03. Output produksi dibuat di `dist/` dan tidak dimasukkan ke git karena dapat digenerate ulang.

## Rekomendasi Lanjutan

- Pisahkan `src/App.tsx` menjadi modul `features/auth`, `features/dashboard`, `components/ui`, dan `lib`.
- Tambahkan React Hook Form + Zod untuk validasi login/register.
- Hubungkan login/register ke backend auth saat API tersedia.
- Tambahkan E2E Playwright untuk login empat role dan register.
