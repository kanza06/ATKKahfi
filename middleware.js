import { NextResponse } from 'next/server';
import { verifySession, COOKIE } from '@/lib/jwt';

const PUBLIK = ['/login', '/api/auth/login', '/api/auth/logout', '/api/setup-db'];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (PUBLIK.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Belum login' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|icon-192.png|icon-512.png|icon-maskable-512.png).*)'],
};
