import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export const json = (data, status = 200) => NextResponse.json(data, { status });

// Pastikan pengguna sudah login (dan punya salah satu peran yang diizinkan)
export async function requireUser(roles) {
  const s = await getSession();
  if (!s) throw new HttpError('Belum login', 401);
  if (roles && !roles.includes(s.role)) throw new HttpError('Hanya admin yang boleh melakukan ini', 403);
  return s;
}

// Bungkus handler agar semua error menjadi JSON yang rapi
export function wrap(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      if (e?.code === 'ER_DUP_ENTRY') return json({ error: 'Data dengan nilai yang sama sudah ada' }, 409);
      return json({ error: 'Terjadi kesalahan di server. Periksa koneksi database.' }, 500);
    }
  };
}

export async function body(req) {
  try {
    return await req.json();
  } catch {
    throw new HttpError('Data yang dikirim tidak valid');
  }
}

// Foto dikirim sebagai data URL (hasil resize di browser)
export function parseGambar(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) throw new HttpError('Format foto tidak didukung');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 2 * 1024 * 1024) throw new HttpError('Ukuran foto terlalu besar (maks 2 MB)');
  return { mime: m[1], buf };
}
