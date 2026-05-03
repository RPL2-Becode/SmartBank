# SmartBank Web

Frontend portal SmartBank untuk tugas besar RPL II. Aplikasi ini dibangun dengan React + Vite + TypeScript dan saat ini difokuskan pada tampilan bank profesional: login, register, dan dashboard role-based.

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

Halaman `/` langsung membuka login. Role demo tersedia:

- Nasabah Individu
- Teller Cabang
- Operasional Bank
- Manajer / Approver

Catatan: data saat ini memakai state mock di browser agar desain dan flow presentasi bisa langsung dijalankan. Integrasi backend nyata dapat diarahkan melalui `VITE_API_BASE_URL`.
