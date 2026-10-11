import { query } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const PUT = wrap(async (req, { params }) => {
  await requireUser(['admin']);
  const b = await body(req);
  const nama = String(b.nama || '').trim().slice(0, 100);
  if (!nama) throw new HttpError('Nama kategori wajib diisi');
  try {
    await query('UPDATE categories SET nama = ? WHERE id = ?', [nama, Number(params.id)]);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new HttpError('Nama kategori sudah dipakai', 409);
    throw e;
  }
  return json({ ok: true });
});

export const DELETE = wrap(async (req, { params }) => {
  await requireUser(['admin']);
  const id = Number(params.id);
  const [r] = await query('SELECT COUNT(*) AS n FROM products WHERE category_id = ? AND aktif = 1', [id]);
  if (r.n > 0) throw new HttpError('Kategori masih berisi barang. Pindahkan barangnya ke kategori lain dulu.', 409);
  await query('DELETE FROM categories WHERE id = ?', [id]);
  return json({ ok: true });
});
