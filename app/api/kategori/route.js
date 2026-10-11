import { query } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = wrap(async () => {
  const user = await requireUser();
  const kategori = await query(
    `SELECT c.id, c.nama,
            COUNT(p.id) AS jumlah_barang,
            COALESCE(SUM(p.stok), 0) AS total_stok,
            COALESCE(SUM(p.stok * p.harga_beli), 0) AS nilai_modal,
            COALESCE(SUM(p.stok * p.harga_jual), 0) AS nilai_jual
     FROM categories c
     LEFT JOIN products p ON p.category_id = c.id AND p.aktif = 1
     GROUP BY c.id, c.nama
     ORDER BY c.nama`);
  const [total] = await query(
    `SELECT COUNT(*) AS jumlah_barang, COALESCE(SUM(stok), 0) AS total_stok,
            COALESCE(SUM(stok * harga_beli), 0) AS nilai_modal,
            COALESCE(SUM(stok * harga_jual), 0) AS nilai_jual
     FROM products WHERE aktif = 1`);

  if (user.role !== 'admin') {
    return json({ kategori: kategori.map(({ id, nama }) => ({ id, nama })), total: null });
  }
  return json({ kategori, total });
});

export const POST = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const nama = String(b.nama || '').trim().slice(0, 100);
  if (!nama) throw new HttpError('Nama kategori wajib diisi');
  try {
    const r = await query('INSERT INTO categories (nama) VALUES (?)', [nama]);
    return json({ id: r.insertId, nama }, 201);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new HttpError('Kategori sudah ada', 409);
    throw e;
  }
});
