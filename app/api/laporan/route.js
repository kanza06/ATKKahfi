import { wrap, json, requireUser } from '@/lib/api';
import { ambilLaporan } from '@/lib/laporan';
import { bulanIni } from '@/lib/format';

export const dynamic = 'force-dynamic';

export const GET = wrap(async (req) => {
  await requireUser(['admin']);
  const sp = new URL(req.url).searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(sp.get('bulan') || '') ? sp.get('bulan') : bulanIni();
  return json(await ambilLaporan(bulan));
});
