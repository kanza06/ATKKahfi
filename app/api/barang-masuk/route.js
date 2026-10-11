import { query, tx } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';
import { nowWib } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const GET = wrap(async () => {
  await requireUser(['admin']);
  const riwayat = await query(
    `SELECT p.id, p.tanggal, p.supplier, p.total, p.catatan,
            (SELECT COUNT(*) FROM purchase_items i WHERE i.purchase_id = p.id) AS jumlah_item
     FROM purchases p ORDER BY p.id DESC LIMIT 30`);
  return json({ riwayat });
});

export const POST = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const supplier = String(b.supplier || '').trim().slice(0, 150) || null;
  const catatan = String(b.catatan || '').trim().slice(0, 255) || null;
  const items = (Array.isArray(b.items) ? b.items : [])
    .map((i) => ({
      product_id: Number(i.product_id),
      qty: parseInt(i.qty, 10),
      harga_beli: Math.max(0, Number(i.harga_beli) || 0),
    }))
    .filter((i) => i.product_id && i.qty > 0);
  if (items.length === 0) throw new HttpError('Tambahkan minimal satu barang');

  const hasil = await tx(async (c) => {
    const now = nowWib();
    let total = 0;
    const [pur] = await c.query('INSERT INTO purchases (tanggal, supplier, total, catatan) VALUES (?, ?, 0, ?)', [now, supplier, catatan]);
    const pid = pur.insertId;

    for (const it of items) {
      const [rows] = await c.query('SELECT id, nama FROM products WHERE id = ? AND aktif = 1 FOR UPDATE', [it.product_id]);
      if (!rows[0]) throw new HttpError('Ada barang yang tidak ditemukan');
      total += it.qty * it.harga_beli;
      await c.query(
        'INSERT INTO purchase_items (purchase_id, product_id, nama, qty, harga_beli) VALUES (?, ?, ?, ?, ?)',
        [pid, it.product_id, rows[0].nama, it.qty, it.harga_beli]);
      await c.query(
        'UPDATE products SET stok = stok + ?, harga_beli = IF(? > 0, ?, harga_beli) WHERE id = ?',
        [it.qty, it.harga_beli, it.harga_beli, it.product_id]);
      await c.query(
        "INSERT INTO stock_movements (product_id, tipe, qty, referensi, tanggal) VALUES (?, 'masuk', ?, ?, ?)",
        [it.product_id, it.qty, `Barang masuk #${pid}`, now]);
    }

    await c.query('UPDATE purchases SET total = ? WHERE id = ?', [total, pid]);
    if (b.catat_kas !== false && total > 0) {
      await c.query(
        "INSERT INTO cash_entries (tanggal, tipe, kategori, jumlah, catatan, purchase_id) VALUES (?, 'keluar', 'Beli stok', ?, ?, ?)",
        [now, total, supplier ? `Dari ${supplier}` : `Barang masuk #${pid}`, pid]);
    }
    return { id: pid, total };
  });

  return json(hasil, 201);
});
