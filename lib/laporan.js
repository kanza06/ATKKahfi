import { query } from '@/lib/db';
import { rangeBulan } from '@/lib/format';
import { hitungSaldo } from '@/lib/kas';

export async function ambilLaporan(bulan) {
  const [start, end] = rangeBulan(bulan);
  const rentang = [start, end];

  const [jual] = await query('SELECT COUNT(*) AS transaksi, COALESCE(SUM(total), 0) AS omzet FROM sales WHERE tanggal >= ? AND tanggal < ?', rentang);
  const [laba] = await query(
    `SELECT COALESCE(SUM(si.subtotal - si.harga_beli * si.qty), 0) AS laba
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.tanggal >= ? AND s.tanggal < ?`, rentang);
  const [kas] = await query(
    `SELECT COALESCE(SUM(CASE WHEN tipe = 'masuk' THEN jumlah END), 0) AS masuk,
            COALESCE(SUM(CASE WHEN tipe = 'keluar' THEN jumlah END), 0) AS keluar
     FROM cash_entries WHERE tanggal >= ? AND tanggal < ?`, rentang);

  const harian = await query(
    `SELECT DATE(tanggal) AS tgl, COUNT(*) AS transaksi, SUM(total) AS omzet
     FROM sales WHERE tanggal >= ? AND tanggal < ? GROUP BY DATE(tanggal) ORDER BY tgl`, rentang);
  const terlaris = await query(
    `SELECT si.nama, SUM(si.qty) AS qty, SUM(si.subtotal) AS pendapatan
     FROM sale_items si JOIN sales s ON s.id = si.sale_id
     WHERE s.tanggal >= ? AND s.tanggal < ?
     GROUP BY si.product_id, si.nama ORDER BY qty DESC LIMIT 10`, rentang);
  const per_kategori = await query(
    `SELECT COALESCE(c.nama, 'Tanpa kategori') AS kategori, SUM(si.qty) AS qty, SUM(si.subtotal) AS omzet
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     LEFT JOIN products p ON p.id = si.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE s.tanggal >= ? AND s.tanggal < ?
     GROUP BY COALESCE(c.nama, 'Tanpa kategori') ORDER BY omzet DESC`, rentang);
  const per_metode = await query(
    `SELECT metode, COUNT(*) AS jumlah, SUM(total) AS total
     FROM sales WHERE tanggal >= ? AND tanggal < ? GROUP BY metode ORDER BY total DESC`, rentang);
  const pengeluaran = await query(
    `SELECT kategori, SUM(jumlah) AS total FROM cash_entries
     WHERE tipe = 'keluar' AND tanggal >= ? AND tanggal < ? GROUP BY kategori ORDER BY total DESC`, rentang);
  const stok_menipis = await query(
    'SELECT nama, stok, stok_min FROM products WHERE aktif = 1 AND stok <= stok_min ORDER BY stok ASC, nama LIMIT 30');
  const [nilai] = await query(
    'SELECT COALESCE(SUM(stok * harga_beli), 0) AS modal, COALESCE(SUM(stok * harga_jual), 0) AS jual FROM products WHERE aktif = 1');
  const saldo = await hitungSaldo();

  const transaksi = Number(jual.transaksi || 0);
  const omzet = Number(jual.omzet || 0);
  return {
    bulan,
    ringkas: {
      omzet,
      transaksi,
      rata_rata: transaksi ? Math.round(omzet / transaksi) : 0,
      laba_kasar: Number(laba.laba || 0),
      kas_masuk: Number(kas.masuk || 0),
      kas_keluar: Number(kas.keluar || 0),
    },
    harian,
    terlaris,
    per_kategori,
    per_metode,
    pengeluaran,
    stok_menipis,
    nilai_barang: { modal: Number(nilai.modal || 0), jual: Number(nilai.jual || 0) },
    saldo_toko: saldo.saldo,
  };
}
