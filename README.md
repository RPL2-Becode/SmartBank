# SmartBank Web

Frontend portal SmartBank untuk tugas besar RPL II. Aplikasi ini dibangun dengan React + Vite + TypeScript dan saat ini difokuskan pada tampilan bank profesional: login/register dark card dan app banking responsive dengan fixed sidebar.

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

Route utama setelah login:

- `/dashboard` untuk overview ringkas
- `/rekening` untuk detail rekening
- `/transaksi` untuk aktivitas transaksi
- `/kartu` untuk kartu dan limit
- `/insight` untuk metrik role
- `/kontrol` untuk kontrol sistem

Catatan: data saat ini memakai state mock di browser agar desain dan flow presentasi bisa langsung dijalankan. Integrasi backend nyata dapat diarahkan melalui `VITE_API_BASE_URL`, tetapi URL API tidak ditampilkan di UI.
