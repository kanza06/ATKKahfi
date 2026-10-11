import { NextResponse } from 'next/server';
import { pool, query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Buat tabel-tabel database
    const schemaQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','kasir') NOT NULL DEFAULT 'kasir',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS categories (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS products (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        barcode VARCHAR(64) NULL UNIQUE,
        nama VARCHAR(150) NOT NULL,
        category_id INT UNSIGNED NULL,
        satuan VARCHAR(20) NOT NULL DEFAULT 'pcs',
        harga_beli BIGINT NOT NULL DEFAULT 0,
        harga_jual BIGINT NOT NULL DEFAULT 0,
        stok INT NOT NULL DEFAULT 0,
        stok_min INT NOT NULL DEFAULT 0,
        aktif TINYINT(1) NOT NULL DEFAULT 1,
        has_image TINYINT(1) NOT NULL DEFAULT 0,
        image_v INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_products_nama (nama),
        KEY idx_products_category (category_id),
        CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS product_images (
        product_id INT UNSIGNED PRIMARY KEY,
        mime VARCHAR(50) NOT NULL,
        data LONGBLOB NOT NULL,
        CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS sales (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nomor VARCHAR(30) NOT NULL UNIQUE,
        tanggal DATETIME NOT NULL,
        kasir_id INT UNSIGNED NULL,
        total BIGINT NOT NULL,
        bayar BIGINT NOT NULL,
        kembalian BIGINT NOT NULL DEFAULT 0,
        metode ENUM('tunai','qris','transfer') NOT NULL DEFAULT 'tunai',
        KEY idx_sales_tanggal (tanggal),
        CONSTRAINT fk_sales_kasir FOREIGN KEY (kasir_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS sale_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        sale_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NULL,
        nama VARCHAR(150) NOT NULL,
        qty INT NOT NULL,
        harga_jual BIGINT NOT NULL,
        harga_beli BIGINT NOT NULL DEFAULT 0,
        subtotal BIGINT NOT NULL,
        CONSTRAINT fk_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS purchases (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tanggal DATETIME NOT NULL,
        supplier VARCHAR(150) NULL,
        total BIGINT NOT NULL DEFAULT 0,
        catatan VARCHAR(255) NULL,
        KEY idx_purchases_tanggal (tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS purchase_items (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT UNSIGNED NOT NULL,
        product_id INT UNSIGNED NULL,
        nama VARCHAR(150) NOT NULL,
        qty INT NOT NULL,
        harga_beli BIGINT NOT NULL,
        CONSTRAINT fk_pitems_purchase FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
        CONSTRAINT fk_pitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS stock_movements (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        product_id INT UNSIGNED NOT NULL,
        tipe ENUM('masuk','keluar','penyesuaian') NOT NULL,
        qty INT NOT NULL,
        referensi VARCHAR(100) NULL,
        tanggal DATETIME NOT NULL,
        KEY idx_moves_product (product_id),
        CONSTRAINT fk_moves_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS cash_entries (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tanggal DATETIME NOT NULL,
        tipe ENUM('masuk','keluar') NOT NULL,
        kategori VARCHAR(60) NOT NULL,
        jumlah BIGINT NOT NULL,
        catatan VARCHAR(255) NULL,
        sale_id INT UNSIGNED NULL,
        purchase_id INT UNSIGNED NULL,
        KEY idx_cash_tanggal (tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS settings (
        k VARCHAR(50) PRIMARY KEY,
        v VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `INSERT IGNORE INTO settings (k, v) VALUES ('saldo_awal', '0')`,

      `INSERT IGNORE INTO categories (nama) VALUES
        ('Alat Tulis'), ('Kertas & Buku'), ('Map & Arsip'), ('Perlengkapan Meja'), ('Perlengkapan Sekolah')`
    ];

    for (const q of schemaQueries) {
      await query(q);
    }

    // 2. Buat akun admin default jika belum ada
    const admins = await query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    let adminStatus = 'Akun admin sudah ada.';
    if (admins.length === 0) {
      const username = process.env.ADMIN_USERNAME || 'admin';
      const password = process.env.ADMIN_PASSWORD || 'admin123';
      const nama = process.env.ADMIN_NAMA || 'Pemilik ATK Kahfi';
      const hash = await bcrypt.hash(password, 10);
      await query(
        'INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [nama, username, hash, 'admin']
      );
      adminStatus = `Akun admin berhasil dibuat (username: ${username}, password: ${password})`;
    }

    return NextResponse.json({
      ok: true,
      message: 'Inisialisasi tabel dan pengaturan database ATK Kahfi berhasil!',
      admin: adminStatus
    });
  } catch (error) {
    console.error('Setup DB Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Terjadi kesalahan saat inisialisasi database' },
      { status: 500 }
    );
  }
}

