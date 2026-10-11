import { query } from '@/lib/db';
import { wrap, json, requireUser, body, HttpError } from '@/lib/api';
import { hitungSaldo } from '@/lib/kas';

export const dynamic = 'force-dynamic';

// Admin mengisi jumlah uang yang ada sekarang. Saldo awal dihitung ulang
// supaya saldo toko persis sama dengan angka yang dimasukkan.
export const PUT = wrap(async (req) => {
  await requireUser(['admin']);
  const b = await body(req);
  const saldo = Math.round(Number(b.saldo));
  if (!Number.isFinite(saldo)) throw new HttpError('Nominal saldo tidak valid');
  const { net } = await hitungSaldo();
  await query(
    "INSERT INTO settings (k, v) VALUES ('saldo_awal', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",
    [String(saldo - net)]);
  return json({ saldo });
});
