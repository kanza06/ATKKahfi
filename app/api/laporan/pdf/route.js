import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { wrap, requireUser } from '@/lib/api';
import { ambilLaporan } from '@/lib/laporan';
import { bulanIni, namaBulan, rupiah, angka } from '@/lib/format';
import { NAMA_TOKO } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = wrap(async (req) => {
  await requireUser(['admin']);
  const sp = new URL(req.url).searchParams;
  const bulan = /^\d{4}-\d{2}$/.test(sp.get('bulan') || '') ? sp.get('bulan') : bulanIni();
  const L = await ambilLaporan(bulan);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const tinggi = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(NAMA_TOKO, 40, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Laporan bulanan - ${namaBulan(bulan)}`, 40, 74);
  let y = 100;

  function tabel(judul, head, rows, kanan = []) {
    if (!rows.length) return;
    if (y > tinggi - 140) { doc.addPage(); y = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(judul, 40, y);
    const columnStyles = {};
    kanan.forEach((i) => { columnStyles[i] = { halign: 'right' }; });
    autoTable(doc, {
      startY: y + 8,
      head: [head],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [42, 62, 177] },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles,
      margin: { left: 40, right: 40 },
    });
    y = doc.lastAutoTable.finalY + 26;
  }

  const r = L.ringkas;
  tabel('Ringkasan', ['Keterangan', 'Nilai'], [
    ['Total penjualan', rupiah(r.omzet)],
    ['Jumlah transaksi', angka(r.transaksi)],
    ['Rata-rata nilai transaksi', rupiah(r.rata_rata)],
    ['Laba kasar', rupiah(r.laba_kasar)],
    ['Uang masuk (kas)', rupiah(r.kas_masuk)],
    ['Uang keluar (kas)', rupiah(r.kas_keluar)],
    ['Saldo toko saat ini', rupiah(L.saldo_toko)],
    ['Nilai barang (harga beli)', rupiah(L.nilai_barang.modal)],
    ['Nilai barang (harga jual)', rupiah(L.nilai_barang.jual)],
  ], [1]);

  tabel('Penjualan harian', ['Tanggal', 'Transaksi', 'Total'],
    L.harian.map((h) => [h.tgl, angka(h.transaksi), rupiah(h.omzet)]), [1, 2]);
  tabel('Produk terlaris', ['Produk', 'Terjual', 'Pendapatan'],
    L.terlaris.map((t) => [t.nama, angka(t.qty), rupiah(t.pendapatan)]), [1, 2]);
  tabel('Penjualan per kategori', ['Kategori', 'Terjual', 'Pendapatan'],
    L.per_kategori.map((k) => [k.kategori, angka(k.qty), rupiah(k.omzet)]), [1, 2]);
  tabel('Metode pembayaran', ['Metode', 'Transaksi', 'Total'],
    L.per_metode.map((m) => [m.metode, angka(m.jumlah), rupiah(m.total)]), [1, 2]);
  tabel('Pengeluaran', ['Kategori', 'Total'],
    L.pengeluaran.map((p) => [p.kategori, rupiah(p.total)]), [1]);
  tabel('Stok menipis atau habis', ['Barang', 'Stok', 'Batas'],
    L.stok_menipis.map((s) => [s.nama, angka(s.stok), angka(s.stok_min)]), [1, 2]);

  const buf = Buffer.from(doc.output('arraybuffer'));
  return new Response(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laporan-atk-kahfi-${bulan}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
});
