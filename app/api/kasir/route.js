import { tx } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';
import { nowWib } from '@/lib/format';
import { METODE } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const POST = wrap(async (req) => {
  const user = await requireUser();
  const b = await body(req);
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0) throw new HttpError('Keranjang masih kosong');
  const metode = METODE.includes(b.metode) ? b.metode : 'tunai';

  const hasil = await tx(async (c) => {
    const now = nowWib();
    const baris = [];
    let total = 0;

    for (const it of items) {
      const qty = parseInt(it.qty, 10);
      if (!qty || qty < 1) throw new HttpError('Jumlah barang tidak valid');
      const [rows] = await c.query(
        'SELECT id, nama, harga_jual, harga_beli, stok FROM products WHERE id = ? AND aktif = 1 FOR UPDATE',
        [Number(it.product_id)]);
      const p = rows[0];
      if (!p) throw new HttpError('Ada barang yang sudah tidak tersedia');
      if (p.stok < qty) throw new HttpError(`Stok "${p.nama}" tidak cukup (sisa ${p.stok})`);
      await c.query('UPDATE products SET stok = stok - ? WHERE id = ?', [qty, p.id]);
      const subtotal = p.harga_jual * qty;
      total += subtotal;
      baris.push({ p, qty, subtotal });
    }

    const bayar = metode === 'tunai' ? Number(b.bayar) : total;
    if (!Number.isFinite(bayar) || bayar < total) throw new HttpError('Uang diterima kurang dari total');
    const kembalian = bayar - total;

    const hari = now.slice(0, 10);
    const [cnt] = await c.query('SELECT COUNT(*) AS n FROM sales WHERE DATE(tanggal) = ?', [hari]);
    const nomor = `INV-${hari.replace(/-/g, '')}-${String(Number(cnt[0].n) + 1).padStart(4, '0')}`;

    const [s] = await c.query(
      'INSERT INTO sales (nomor, tanggal, kasir_id, total, bayar, kembalian, metode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nomor, now, user.uid, total, bayar, kembalian, metode]);
    const saleId = s.insertId;

    for (const { p, qty, subtotal } of baris) {
      await c.query(
        'INSERT INTO sale_items (sale_id, product_id, nama, qty, harga_jual, harga_beli, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [saleId, p.id, p.nama, qty, p.harga_jual, p.harga_beli, subtotal]);
      await c.query(
        "INSERT INTO stock_movements (product_id, tipe, qty, referensi, tanggal) VALUES (?, 'keluar', ?, ?, ?)",
        [p.id, qty, nomor, now]);
    }
    await c.query(
      "INSERT INTO cash_entries (tanggal, tipe, kategori, jumlah, catatan, sale_id) VALUES (?, 'masuk', 'Penjualan', ?, ?, ?)",
      [now, total, nomor, saleId]);

    return { id: saleId, nomor, total, bayar, kembalian, metode };
  });

  return json(hasil, 201);
});
