import { query } from '@/lib/db';

// Saldo toko = saldo awal + uang masuk - uang keluar
export async function hitungSaldo() {
  const [s] = await query("SELECT v FROM settings WHERE k = 'saldo_awal'");
  const awal = Number(s?.v || 0);
  const [n] = await query("SELECT COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah ELSE -jumlah END), 0) AS net FROM cash_entries");
  return { saldo_awal: awal, saldo: awal + Number(n.net || 0), net: Number(n.net || 0) };
}
