import { cookies } from 'next/headers';
import { COOKIE, verifySession } from '@/lib/jwt';

export async function getSession() {
  const token = cookies().get(COOKIE)?.value;
  return token ? verifySession(token) : null;
}
