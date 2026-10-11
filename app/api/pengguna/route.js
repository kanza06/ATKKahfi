import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = wrap(async () => {
  await requireUser(['admin']);
  const pengguna = await query('SELECT id, nama, username, role FROM users ORDER BY role, nama');
  return json({ pengguna });
});

export const POST = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const nama = String(b.nama || '').trim().slice(0, 100);
  const username = String(b.username || '').trim().toLowerCase().slice(0, 50);
  const password = String(b.password || '');
  const role = b.role === 'admin' ? 'admin' : 'kasir';
  if (!nama || !username) throw new HttpError('Nama dan username wajib diisi');
  if (password.length < 6) throw new HttpError('Password minimal 6 karakter');
  try {
    await query('INSERT INTO users (nama, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [nama, username, await bcrypt.hash(password, 10), role]);
  } catch (e) {
    if (e?.code === 'ER_DUP_ENTRY') throw new HttpError('Username sudah dipakai', 409);
    throw e;
  }
  return json({ ok: true }, 201);
});

// Ganti password pengguna: PUT { id, password }
export const PUT = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  if (String(b.password || '').length < 6) throw new HttpError('Password minimal 6 karakter');
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(String(b.password), 10), Number(b.id)]);
  return json({ ok: true });
});

export const DELETE = wrap(async (req) => {
  const me = await requireUser(['admin']);
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (id === Number(me.uid)) throw new HttpError('Akun yang sedang dipakai tidak bisa dihapus', 409);
  await query('DELETE FROM users WHERE id = ?', [id]);
  return json({ ok: true });
});
