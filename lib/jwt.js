import { SignJWT, jwtVerify } from 'jose';

export const COOKIE = 'atk_session';

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-secret-ganti-di-production');
}

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key());
}

export async function verifySession(token) {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}
