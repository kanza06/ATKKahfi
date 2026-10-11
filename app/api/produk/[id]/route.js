import { query, tx } from '@/lib/db';
import { wrap, json, requireUser, body, parseGambar, HttpError } from '@/lib/api';
import { mapProduk, parseBarcode } from '@/lib/produk';
import { nowWib } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const GET = wrap(async (req, { params }) => {
  const user = await requireUser();
  const [p] = await query(
    `SELECT p.id, p.barcode, p.nama, p.category_id, c.nama AS kategori, p.satuan,
            p.harga_beli, p.harga_jual, p.stok, p.stok_min, p.has_image, p.image_v
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ? AND p.aktif = 1`, [Number(params.id)]);
  if (!p) throw new HttpError('Barang tidak ditemukan', 404);
  return json({ produk: mapProduk(p, user.role === 'admin') });
});

export const PUT = wrap(async (req, { params }) => {
  await requireUser(['admin']);
  const id = Number(params.id);
  const b = await body(req);
  const nama = String(b.nama || '').trim().slice(0, 150);
  const hargaJual = Number(b.harga_jual);
  if (!nama) throw new HttpError('Nama barang wajib diisi');
  if (!Number.isFinite(hargaJual) || hargaJual < 0) throw new HttpError('Harga jual tidak valid');
  const stokBaru = Math.max(0, parseInt(b.stok, 10) || 0);
  const img = b.gambar ? parseGambar(b.gambar) : null;

  try {
    await tx(async (c) => {
      const [rows] = await c.query('SELECT id, stok FROM products WHERE id = ? AND aktif = 1 FOR UPDATE', [id]);
      const lama = rows[0];
      if (!lama) throw new HttpError('Barang tidak ditemukan', 404);

      await c.query(
        `UPDATE products SET barcode = ?, nama = ?, category_id = ?, satuan = ?,
                harga_beli = ?, harga_jual = ?, stok = ?, stok_min = ? WHERE id = ?`,
        [
          parseBarcode(b.barcode), nama, b.category_id || null,
          String(b.satuan || 'pcs').slice(0, 20),
          Math.max(0, Number(b.harga_beli) || 0), hargaJual, stokBaru,
          Math.max(0, parseInt(b.stok_min, 10) || 0), id,
        ]);

      if (stokBaru !== lama.stok) {
        await c.query(
          "INSERT INTO stock_movements (product_id, tipe, qty, referensi, tanggal) VALUES (?, 'penyesuaian', ?, 'Edit barang', ?)",
          [id, stokBaru - lama.stok, nowWib()]);
      }
      if (img) {
        await c.query(
          `INSERT INTO product_images (product_id, mime, data) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE mime = VALUES(mime), data = VALUES(data)`,
          [id, img.mime, img.buf]);
        await c.query('UPDATE products SET has_image = 1, image_v = image_v + 1 WHERE id = ?', [id]);
      } else if (b.hapus_gambar) {
        await c.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        await c.query('UPDATE products SET has_image = 0, image_v = image_v + 1 WHERE id = ?', [id]);
      }
    });
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new HttpError('Barcode sudah dipakai barang lain', 409);
    throw e;
  }
  return json({ ok: true });
});

// Hapus = nonaktifkan, supaya riwayat penjualan tetap utuh
export const DELETE = wrap(async (req, { params }) => {
  await requireUser(['admin']);
  await query('UPDATE products SET aktif = 0, barcode = NULL WHERE id = ?', [Number(params.id)]);
  return json({ ok: true });
});
