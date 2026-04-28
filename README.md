# 🏦 SmartBank (Core System)

Selamat datang di repositori **SmartBank**, inti dari ekosistem ekonomi simulasi UMKM (Tugas Besar RPL II). 

SmartBank bertindak sebagai **Regulator & Payment Processor** yang menjadi _single source of truth_ untuk seluruh transaksi keuangan di dalam ekosistem ini. Semua aplikasi satelit (Marketplace, POS, SupplierHub, LogistiKita, dll) wajib melalui SmartBank untuk memproses pembayaran dan perputaran uang.

---

## 🛠️ Tech Stack
Backend SmartBank dibangun menggunakan teknologi modern:
- **Node.js** & **Express.js** (REST API Framework)
- **MongoDB** & **Mongoose** (Database & ODM)
- **JSON Web Token (JWT)** (Autentikasi & Otorisasi)
- **Bcrypt.js** (Enkripsi Password)

---

## ✨ Fitur Utama
1. **Registrasi & Login:** Autentikasi aman berbasis JWT. Mahasiswa (User) otomatis mendapat saldo awal Rp 50.000.
2. **Manajemen Saldo:** Pengecekan saldo dan riwayat 10 transaksi terakhir secara _real-time_.
3. **Transfer Antar User:** Mengirim uang ke pengguna lain (dikenakan 1% fee bank & 2% pajak sistem).
4. **Pembayaran Terpusat:** Memproses pembayaran dari berbagai aplikasi ekosistem (Marketplace, POS, dll) dengan potongan *fee* yang dinamis (contoh: Marketplace 2%, POS 1%).
5. **Pinjaman (Loan):** Pengguna dapat meminjam dana darurat hingga Rp 100.000 dengan sistem bunga 10%.
6. **Ledger Transaksi:** Pencatatan komprehensif seluruh rekam jejak arus kas dalam ekosistem (untuk pelacakan auditor/admin).

---

## 🚀 Cara Menjalankan Project (Setup Guide)

### 1. Persiapan
Pastikan Anda sudah menginstall:
- [Node.js](https://nodejs.org/) (versi 18+)
- [MongoDB](https://www.mongodb.com/) (berjalan di lokal `mongodb://localhost:27017` atau gunakan MongoDB Atlas)

### 2. Instalasi
Clone repositori ini, masuk ke folder `backend`, dan jalankan instalasi *dependency*:
```bash
cd backend
npm install
```

### 3. Konfigurasi Environment Variables
Pastikan terdapat file `.env` di dalam folder `backend` yang berisi minimal konfigurasi berikut:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/SmartBank
JWT_SECRET=rahasia_smartbank_paling_aman_123
```

### 4. Menjalankan Server
Untuk *development* (otomatis me-restart server bila ada perubahan kode):
```bash
npm run dev
```
Atau untuk produksi:
```bash
npm start
```
Server akan berjalan di `http://localhost:5000`.

---

## 📡 Dokumentasi API Endpoints

Semua endpoint API Bank (kecuali *Auth*) memerlukan HTTP Header: 
`Authorization: Bearer <TOKEN>`

| Method | Endpoint | Deskripsi |
| --- | --- | --- |
| `POST` | `/smartbank/auth/register` | Mendaftarkan akun baru (Dapat modal 50k) |
| `POST` | `/smartbank/auth/login` | Login user untuk mendapatkan JWT Token |
| `GET` | `/smartbank/balance` | Mengecek saldo aktif & riwayat transaksi |
| `POST` | `/smartbank/transfer` | Transfer saldo antar akun |
| `POST` | `/smartbank/payment` | API Pembayaran sentral untuk aplikasi luar |
| `POST` | `/smartbank/loan` | Mengajukan pinjaman (Max 100k) |
| `GET` | `/smartbank/ledger` | Melihat seluruh *Ledger* Ekosistem (Admin) |

*(Untuk detail _payload_ / _body_ yang dibutuhkan di masing-masing request, dapat dicek langsung di folder `controllers`)*

---

### Tim Pengembang
Tugas Besar Mata Kuliah Rekayasa Perangkat Lunak 2 (RPL II)
Dosen: **M. Yusril Helmi Setyawan, S.Kom., M.Kom.**
