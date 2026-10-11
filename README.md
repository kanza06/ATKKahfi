# ATK Kahfi — Kasir, Stok, dan Kas

Isi paket ini:

| Folder | Isi |
|---|---|
| `web/` | Aplikasi web: Next.js (App Router) + Tailwind CSS + MySQL |
| `android/` | Aplikasi Android (Kotlin) berupa WebView ke alamat web di Vercel |
| `ikon/` | Ikon ATK Kahfi: SVG dan PNG (1024, 512 untuk Play Store, 192, 180, maskable) |

## Fitur

- **Kasir:** cari barang, keranjang, tunai/QRIS/transfer, uang diterima dan kembalian. Stok berkurang otomatis dan uang masuk tercatat di kas.
- **Produk:** foto (kamera bawaan HP), nama, kategori, barcode, harga beli, harga jual, stok, batas stok menipis. Bisa edit dan hapus.
- **Kategori:** tambah, ubah, hapus, dan menampilkan **total nilai barang** (stok × harga beli, serta nilai jual) per kategori dan keseluruhan.
- **Barang masuk:** catat pembelian dari supplier, stok bertambah, otomatis tercatat sebagai uang keluar (bisa dimatikan).
- **Stok habis:** daftar barang habis dan menipis, plus tombol salin daftar belanja.
- **Kas:** **saldo toko** (isi jumlah uang yang ada), catatan uang masuk/keluar manual, riwayat per bulan.
- **Laporan bulanan:** ringkasan, grafik harian, produk terlaris, per kategori, metode bayar, pengeluaran, stok menipis. **Ekspor PDF.**
- **Pengguna:** admin dan kasir (kasir hanya memakai Kasir, Produk, dan Stok habis).
- **Android:** pertama kali membuka, masukkan URL Vercel sekali. Alamat tersimpan dan berikutnya langsung terbuka. URL bisa diganti lewat menu titik tiga.

---

## 1. Menjalankan web di komputer (Laragon)

Kebutuhan: Node.js 18.17 atau lebih baru (disarankan 20), Laragon dengan MySQL.

1. Buka Laragon, klik **Start All** (pastikan MySQL menyala).
2. Buka terminal di folder `web`, lalu:
   ```
   npm install
   ```
3. Salin pengaturan:
   - Windows: `copy .env.example .env.local`
   - Mac/Linux: `cp .env.example .env.local`

   Buka `.env.local`, ganti `AUTH_SECRET` dengan teks acak yang panjang. Bawaan Laragon (user `root`, tanpa password) sudah cocok dengan `DATABASE_URL`.
4. Buat database, tabel, dan akun admin:
   ```
   npm run db:setup
   ```
5. Jalankan:
   ```
   npm run dev
   ```
   Buka http://localhost:3000. Login dengan **admin / admin123**, lalu segera ganti password di menu **Pengguna**.

Mencoba dari HP di Wi-Fi yang sama: jalankan `npm run dev -- -H 0.0.0.0`, lalu buka `http://IP-KOMPUTER:3000` di HP (izinkan port 3000 di firewall).

## 2. Deploy ke Vercel

Vercel tidak bisa mengakses MySQL di Laragon. Gunakan MySQL di cloud.

1. Siapkan database MySQL cloud (penyedia mana saja yang memberi koneksi MySQL; cek paket dan harga terbaru di situsnya). Catat URL koneksinya, bentuknya: `mysql://user:password@host:3306/nama_database`. Jika penyedia mewajibkan SSL, isi `DB_SSL=true`.
2. Buat tabel di database cloud dari komputermu: ganti sementara `DATABASE_URL` (dan `DB_SSL`) di `.env.local` ke milik cloud, jalankan `npm run db:setup`, lalu kembalikan ke Laragon.
3. Upload folder `web` ke GitHub, lalu **Import** di Vercel. Jika yang di-upload seluruh paket ini, atur **Root Directory** = `web`.
4. Di **Environment Variables** Vercel, isi `DATABASE_URL`, `DB_SSL`, dan `AUTH_SECRET`.
5. Deploy. Catat alamat hasilnya (misalnya `atk-kahfi.vercel.app`) untuk dimasukkan ke aplikasi Android.

Foto barang disimpan di database (dikecilkan otomatis sekitar 800 px), jadi tidak perlu layanan penyimpanan terpisah.

## 3. Aplikasi Android

1. Buka **Android Studio** (versi terbaru), pilih **Open**, lalu pilih folder `android`. Tunggu sinkronisasi Gradle selesai (butuh internet).
2. Hubungkan HP (aktifkan USB debugging) lalu klik **Run**, atau buat file APK lewat **Build > Build APK(s)**. Hasilnya ada di `android/app/build/outputs/apk/debug/app-debug.apk`.
3. Buka aplikasi **ATK Kahfi**, masukkan alamat Vercel, lalu **Simpan & buka**. Mulai saat itu aplikasi langsung membuka web.
4. **Ganti URL:** menu titik tiga di kanan atas, pilih **Ganti URL**. **Muat ulang** ada di menu yang sama.

Catatan:
- Tombol **Ambil foto** di web membuka kamera bawaan HP. Aplikasi tidak meminta izin kamera.
- **Ekspor PDF** diunduh ke folder **Download** di HP.
- Aplikasi minimal Android 10 (API 29).
- Untuk APK yang dibagikan ke orang lain, buat versi bertanda tangan lewat **Build > Generate Signed Bundle / APK**.
- Lalu lintas `http://` diizinkan agar bisa mencoba ke komputer lokal. Setelah memakai Vercel (https), baris `usesCleartextTraffic` di `AndroidManifest.xml` boleh dihapus.

## 4. Cara kerja saldo dan nilai barang

- **Saldo toko** = saldo awal + semua uang masuk − semua uang keluar. Di menu **Kas > Atur saldo**, isi jumlah uang yang ada sekarang. Sistem menghitung saldo awal agar angkanya persis sama, lalu saldo bergerak otomatis mengikuti penjualan, barang masuk, dan catatan kas.
- **Nilai barang** di menu **Kategori** = jumlah stok × harga beli (modal), ditampilkan juga nilai jika semua terjual (stok × harga jual).
- **Laba kasar** di laporan = penjualan − harga beli barang yang terjual. Harga beli dicatat saat transaksi, jadi laporan lama tidak berubah saat harga berubah.

## 5. Struktur folder

```
web/
  app/              halaman (kasir, produk, kategori, barang-masuk, stok-habis, kas, laporan, pengguna, login)
  app/api/          API (MySQL): auth, kategori, produk, kasir, barang-masuk, kas, laporan (+pdf), pengguna
  components/       Shell (menu), form produk, input rupiah, komponen UI
  lib/              koneksi database, sesi login, format, laporan
  db/schema.sql     skema tabel MySQL
  scripts/          setup-db.mjs (buat tabel dan admin)
android/
  app/src/main/java/id/kahfi/atk/MainActivity.kt   WebView, URL tersimpan, kamera, unduhan
```

## 6. Catatan penting

- **Belum diuji build penuh.** Sintaks dan impor semua file web sudah diperiksa, tetapi `npm install`, `next build`, dan build Gradle belum dijalankan di lingkungan pembuatan (tanpa internet). Jika muncul error, kirim pesan error-nya untuk diperbaiki.
- Ganti `AUTH_SECRET` dan password admin sebelum dipakai sungguhan.
- **Backup:** ekspor database secara berkala (phpMyAdmin/HeidiSQL di Laragon, atau fitur backup penyedia MySQL cloud).
- "Hapus" barang berarti dinonaktifkan, supaya riwayat penjualan tetap utuh.
- Scan barcode saat ini lewat alat scanner (yang bekerja seperti keyboard). Scan lewat kamera belum ada.
- Struk belum bisa dicetak; setelah bayar, ringkasan transaksi ditampilkan di layar.
