'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { angka, namaBulan, rupiah } from '@/lib/format';
import { AdminOnly } from '@/components/Shell';
import { Alert, Icon, PageHeader } from '@/components/ui';

function Kartu({ label, nilai, catatan }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-semibold text-muted">{label}</div>
      <div className="text-2xl font-extrabold tracking-tight mt-1">{nilai}</div>
      {catatan && <div className="text-xs text-muted mt-1">{catatan}</div>}
    </div>
  );
}

function Tabel({ judul, kolom, baris, kanan = [] }) {
  return (
    <div className="card p-5 min-w-0">
      <h3 className="text-lg font-extrabold mb-3">{judul}</h3>
      {baris.length === 0 ? (
        <p className="text-sm text-muted">Belum ada data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold text-muted">
                {kolom.map((k, i) => <th key={k} className={`pb-2 ${kanan.includes(i) ? 'text-right' : ''}`}>{k}</th>)}
              </tr>
            </thead>
            <tbody>
              {baris.map((r, i) => (
                <tr key={i} className="border-t border-line">
                  {r.map((c, j) => <td key={j} className={`py-2.5 ${kanan.includes(j) ? 'text-right font-semibold' : ''}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Isi() {
  const [bulan, setBulan] = useState('');
  const [L, setL] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setErr('');
    api('/api/laporan' + (bulan ? `?bulan=${bulan}` : ''))
      .then((d) => { setL(d); if (!bulan) setBulan(d.bulan); })
      .catch((e) => setErr(e.message));
  }, [bulan]);

  const r = L?.ringkas;
  const maks = Math.max(1, ...(L?.harian || []).map((h) => h.omzet));

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan bulanan" subtitle="Uang masuk, uang keluar, produk terlaris, dan stok untuk satu bulan.">
        <div>
          <label htmlFor="bulan" className="sr-only">Pilih bulan</label>
          <input id="bulan" type="month" className="input w-auto" value={bulan} onChange={(e) => setBulan(e.target.value)} />
        </div>
        {bulan && (
          <a href={`/api/laporan/pdf?bulan=${bulan}`} download className="btn btn-primary min-h-[48px]">
            <Icon name="download" size={18} /> Ekspor PDF
          </a>
        )}
      </PageHeader>
      <Alert>{err}</Alert>

      {L && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kartu label="Total penjualan" nilai={rupiah(r.omzet)} catatan={namaBulan(L.bulan)} />
            <Kartu label="Jumlah transaksi" nilai={angka(r.transaksi)} catatan={`Rata-rata ${rupiah(r.rata_rata)}`} />
            <Kartu label="Laba kasar" nilai={rupiah(r.laba_kasar)} catatan="Penjualan dikurangi harga beli" />
            <Kartu label="Total pengeluaran" nilai={rupiah(r.kas_keluar)} catatan={`Uang masuk ${rupiah(r.kas_masuk)}`} />
            <Kartu label="Saldo toko saat ini" nilai={rupiah(L.saldo_toko)} />
            <Kartu label="Nilai barang (harga beli)" nilai={rupiah(L.nilai_barang.modal)} catatan={`Jika terjual ${rupiah(L.nilai_barang.jual)}`} />
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-extrabold mb-4">Penjualan harian</h3>
            {L.harian.length === 0 ? (
              <p className="text-sm text-muted">Belum ada penjualan di bulan ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-2 h-48 min-w-[420px] border-b border-line pb-1">
                  {L.harian.map((h) => (
                    <div key={h.tgl} className="flex-1 flex flex-col items-center justify-end h-full min-w-[18px]" title={`${h.tgl}: ${rupiah(h.omzet)}`}>
                      <div className="w-full bg-brand rounded-t-md" style={{ height: `${Math.max(4, (h.omzet / maks) * 100)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 min-w-[420px] mt-1.5">
                  {L.harian.map((h) => <div key={h.tgl} className="flex-1 text-center text-[11px] text-muted min-w-[18px]">{Number(h.tgl.slice(8))}</div>)}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Tabel judul="Produk terlaris" kolom={['Produk', 'Terjual', 'Pendapatan']} kanan={[1, 2]}
              baris={L.terlaris.map((t) => [t.nama, angka(t.qty), rupiah(t.pendapatan)])} />
            <Tabel judul="Penjualan per kategori" kolom={['Kategori', 'Terjual', 'Pendapatan']} kanan={[1, 2]}
              baris={L.per_kategori.map((k) => [k.kategori, angka(k.qty), rupiah(k.omzet)])} />
            <Tabel judul="Metode pembayaran" kolom={['Metode', 'Transaksi', 'Total']} kanan={[1, 2]}
              baris={L.per_metode.map((m) => [m.metode, angka(m.jumlah), rupiah(m.total)])} />
            <Tabel judul="Pengeluaran" kolom={['Kategori', 'Total']} kanan={[1]}
              baris={L.pengeluaran.map((p) => [p.kategori, rupiah(p.total)])} />
            <Tabel judul="Stok menipis atau habis" kolom={['Barang', 'Stok', 'Batas']} kanan={[1, 2]}
              baris={L.stok_menipis.map((s) => [s.nama, angka(s.stok), angka(s.stok_min)])} />
          </div>
        </>
      )}
    </div>
  );
}

export default function LaporanPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
