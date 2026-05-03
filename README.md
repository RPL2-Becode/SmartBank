# SmartBank Web

Frontend portal SmartBank Payment Gateway untuk tugas besar RPL II. Aplikasi ini dibangun dengan React + Vite + TypeScript dan menyediakan dashboard role-based untuk user, merchant, admin, developer, dan analytics viewer.

## Menjalankan lokal

```bash
npm install
npm run dev
```

Build produksi:

```bash
npm run build
```

## Environment

Salin `.env.example` bila ingin mengubah target backend:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SWAGGER_URL=http://localhost:3000/api-docs
VITE_ENABLE_MOCK_API=true
```

## Demo login

Halaman `/auth/login` menyediakan pilihan role demo:

- User / Mahasiswa
- Merchant / UMKM
- Supplier
- Admin SmartBank
- Developer / Integrator
- Analytics Viewer

Catatan: data transaksi saat ini memakai state mock di browser agar flow presentasi bisa langsung dijalankan. Integrasi backend nyata dapat diarahkan melalui `VITE_API_BASE_URL`.
