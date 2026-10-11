import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import Shell from '@/components/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const s = await getSession();
  if (!s) redirect('/login');
  return <Shell user={{ id: s.uid, nama: s.nama, role: s.role }}>{children}</Shell>;
}
