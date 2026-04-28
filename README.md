# 🏦 SmartBank (Core System)

Selamat datang di repositori **SmartBank**, inti dari ekosistem ekonomi simulasi UMKM (Tugas Besar RPL II). 

SmartBank bertindak sebagai **Regulator & Payment Processor** yang menjadi _single source of truth_ untuk seluruh transaksi keuangan di dalam ekosistem ini. Semua aplikasi satelit (Marketplace, POS, SupplierHub, LogistiKita, dll) wajib melalui SmartBank untuk memproses pembayaran dan perputaran uang.

---

## 🛠️ Tech Stack
Backend SmartBank dibangun menggunakan teknologi modern:
- **Node.js** & **Express.js** (REST API Framework)
- **MySQL** & **mysql2** (Relational Database & Connection Pool)
- **JSON Web Token (JWT)** (Autentikasi & Otorisasi)
- **Bcrypt.js** (Enkripsi Password)

---

## ✨ Fitur Utama
1. **User Management Berbasis Tier:** Mendukung 4 jenis *Role* (`NASABAH`, `ADMIN`, `TELLER`, `MANAGER`) dan 3 tingkatan *Tier* (`REGULER`, `GOLD`, `PRIORITAS`).
2. **Subsidi Modal:** Semua *user* yang mendaftar secara otomatis mendapat saldo awal Rp 50.000 tanpa memandang Role/Tier.
3. **Manajemen Saldo:** Pengecekan saldo dan riwayat 10 transaksi terakhir secara _real-time_.
4. **Transfer Aman (ACID):** Menggunakan fitur **MySQL Transaction** untuk transfer antar pengguna (dikenakan 1% fee bank & 2% pajak sistem) sehingga uang anti-hilang/nyangkut.
5. **Pembayaran Terpusat:** Memproses pembayaran lintas aplikasi (Marketplace, POS, dll) dengan potongan *fee* yang dinamis.
6. **Pinjaman (Loan):** Pengguna dapat meminjam dana darurat hingga Rp 100.000 dengan sistem bunga 10%.
7. **Ledger Transaksi:** Pencatatan komprehensif seluruh rekam jejak arus kas dalam ekosistem.

---

## 🚀 Cara Menjalankan Project (Setup Guide)

### 1. Persiapan
Pastikan Anda sudah menginstall:
- [Node.js](https://nodejs.org/) (versi 18+)
- **XAMPP / Laragon** (untuk menjalankan MySQL lokal)

### 2. Setup Database (Wajib)
1. Buka **phpMyAdmin** (`http://localhost/phpmyadmin`).
2. Buat database baru dengan nama `SmartBank`.
3. Buka file `database.sql` di folder `backend`, *copy* seluruh isinya, dan eksekusi di menu SQL phpMyAdmin Anda untuk membuat tabel otomatis.

### 3. Instalasi Dependency
Clone repositori ini, masuk ke folder `backend`, dan jalankan:
```bash
cd backend
npm install
```

### 4. Konfigurasi Environment Variables
Pastikan terdapat file `.env` di dalam folder `backend` yang berisi minimal konfigurasi berikut:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=SmartBank
JWT_SECRET=rahasia_smartbank_paling_aman_123
```

### 5. Menjalankan Server
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
| `POST` | `/smartbank/auth/register` | Mendaftarkan akun baru (wajib sertakan `role` & `tier`) |
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
