import { query, tx } from '@/lib/db';
import { wrap, json, requireUser, body, parseGambar, HttpError } from '@/lib/api';
import { mapProduk, parseBarcode } from '@/lib/produk';
import { nowWib } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const GET = wrap(async (req) => {
  const user = await requireUser();
  const sp = new URL(req.url).searchParams;
  const where = ['p.aktif = 1'];
  const args = [];

  const q = (sp.get('q') || '').trim();
  if (q) {
    where.push('(p.nama LIKE ? OR p.barcode LIKE ?)');
    args.push(`%${q}%`, `%${q}%`);
  }
  if (sp.get('kategori')) {
    where.push('p.category_id = ?');
    args.push(Number(sp.get('kategori')));
  }
  const status = sp.get('status');
  if (status === 'habis') where.push('p.stok <= 0');
  if (status === 'kurang') where.push('p.stok <= p.stok_min');

  const rows = await query(
    `SELECT p.id, p.barcode, p.nama, p.category_id, c.nama AS kategori, p.satuan,
            p.harga_beli, p.harga_jual, p.stok, p.stok_min, p.has_image, p.image_v
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(' AND ')}
     ORDER BY p.nama LIMIT 500`, args);
  return json({ produk: rows.map((p) => mapProduk(p, user.role === 'admin')) });
});

export const POST = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const nama = String(b.nama || '').trim().slice(0, 150);
  const hargaJual = Number(b.harga_jual);
  if (!nama) throw new HttpError('Nama barang wajib diisi');
  if (!Number.isFinite(hargaJual) || hargaJual < 0) throw new HttpError('Harga jual tidak valid');
  const stok = Math.max(0, parseInt(b.stok, 10) || 0);
  const img = b.gambar ? parseGambar(b.gambar) : null;

  try {
    const id = await tx(async (c) => {
      const [r] = await c.query(
        `INSERT INTO products (barcode, nama, category_id, satuan, harga_beli, harga_jual, stok, stok_min, has_image, image_v)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseBarcode(b.barcode), nama, b.category_id || null,
          String(b.satuan || 'pcs').slice(0, 20),
          Math.max(0, Number(b.harga_beli) || 0), hargaJual, stok,
          Math.max(0, parseInt(b.stok_min, 10) || 0),
          img ? 1 : 0, img ? 1 : 0,
        ]);
      const id = r.insertId;
      if (img) {
        await c.query('INSERT INTO product_images (product_id, mime, data) VALUES (?, ?, ?)', [id, img.mime, img.buf]);
      }
      if (stok > 0) {
        await c.query(
          "INSERT INTO stock_movements (product_id, tipe, qty, referensi, tanggal) VALUES (?, 'masuk', ?, 'Stok awal', ?)",
          [id, stok, nowWib()]);
      }
      return id;
    });
    return json({ id }, 201);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new HttpError('Barcode sudah dipakai barang lain', 409);
    throw e;
  }
});
