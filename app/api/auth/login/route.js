import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { signSession, COOKIE } from '@/lib/jwt';
import { wrap, body, HttpError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const POST = wrap(async (req) => {
  const b = await body(req);
  const username = String(b.username || '').trim();
  const password = String(b.password || '');
  if (!username || !password) throw new HttpError('Isi username dan password');

  const [u] = await query('SELECT id, nama, password_hash, role FROM users WHERE username = ? LIMIT 1', [username]);
  const cocok = u ? await bcrypt.compare(password, u.password_hash) : false;
  if (!cocok) throw new HttpError('Username atau password salah', 401);

  const token = await signSession({ uid: u.id, nama: u.nama, role: u.role });
  const res = NextResponse.json({ ok: true, nama: u.nama, role: u.role });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
});
