import { wrap, json, requireUser } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = wrap(async () => {
  const s = await requireUser();
  return json({ id: s.uid, nama: s.nama, role: s.role });
});
