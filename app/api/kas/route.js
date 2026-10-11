import { query } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';
import { bulanIni, nowWib, rangeBulan } from '@/lib/format';
import { hitungSaldo } from '@/lib/kas';

export const dynamic = 'force-dynamic';

export const GET = wrap(async (req) => {
  await requireUser(['admin']);
  const sp = new URL(req.url).searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(sp.get('bulan') || '') ? sp.get('bulan') : bulanIni();
  const [start, end] = rangeBulan(bulan);

  const entries = await query(
    `SELECT id, tanggal, tipe, kategori, jumlah, catatan, sale_id, purchase_id
     FROM cash_entries WHERE tanggal >= ? AND tanggal < ?
     ORDER BY tanggal DESC, id DESC LIMIT 500`, [start, end]);
  const [tot] = await query(
    `SELECT COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah END), 0) AS masuk,
            COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah END), 0) AS keluar
     FROM cash_entries WHERE tanggal >= ? AND tanggal < ?`, [start, end]);
  const s = await hitungSaldo();

  return json({ bulan, saldo: s.saldo, masuk_bulan: tot.masuk, keluar_bulan: tot.keluar, entries });
});

export const POST = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const tipe = b.tipe === 'masuk' ? 'masuk' : 'keluar';
  const jumlah = Math.round(Number(b.jumlah));
  const kategori = String(b.kategori || '').trim().slice(0, 60) || (tipe === 'masuk' ? 'Lainnya' : 'Biaya lain');
  const catatan = String(b.catatan || '').trim().slice(0, 255) || null;
  if (!Number.isFinite(jumlah) || jumlah <= 0) throw new HttpError('Jumlah harus lebih dari 0');
  await query(
    'INSERT INTO cash_entries (tanggal, tipe, kategori, jumlah, catatan) VALUES (?, ?, ?, ?, ?)',
    [nowWib(), tipe, kategori, jumlah, catatan]);
  return json({ ok: true }, 201);
});

// Hanya catatan manual yang boleh dihapus (bukan yang berasal dari penjualan / barang masuk)
export const DELETE = wrap(async (req) => {
  await requireUser(['admin']);
  const id = Number(new URL(req.url).searchParams.get('id'));
  const r = await query('DELETE FROM cash_entries WHERE id = ? AND sale_id IS NULL AND purchase_id IS NULL', [id]);
  if (!r.affectedRows) throw new HttpError('Catatan ini dibuat otomatis dan tidak bisa dihapus', 409);
  return json({ ok: true });
});
