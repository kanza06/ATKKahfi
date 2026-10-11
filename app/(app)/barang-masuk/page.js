'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { rupiah, tanggalWaktu } from '@/lib/format';
import { AdminOnly } from '@/components/Shell';
import RupiahInput from '@/components/RupiahInput';
import { Alert, Icon, PageHeader, Sukses } from '@/components/ui';

const BARIS_KOSONG = { product_id: '', qty: 1, harga_beli: '' };

function Isi() {
  const [produk, setProduk] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [baris, setBaris] = useState([{ ...BARIS_KOSONG }]);
  const [supplier, setSupplier] = useState('');
  const [catatan, setCatatan] = useState('');
  const [catatKas, setCatatKas] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  const muat = useCallback(async (awal) => {
    try {
      const [a, b] = await Promise.all([api('/api/produk'), api('/api/barang-masuk')]);
      setProduk(a.produk);
      setRiwayat(b.riwayat);
      if (awal) {
        const id = new URLSearchParams(window.location.search).get('produk');
        const p = a.produk.find((x) => String(x.id) === id);
        if (p) setBaris([{ product_id: p.id, qty: 1, harga_beli: p.harga_beli }]);
      }
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => { muat(true); }, [muat]);

  function ubah(i, patch) {
    setBaris((b) => b.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function pilihBarang(i, id) {
    const p = produk.find((x) => String(x.id) === String(id));
    ubah(i, { product_id: id, harga_beli: p ? p.harga_beli : '' });
  }

  const total = baris.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.harga_beli) || 0), 0);

  async function simpan(e) {
    e.preventDefault();
    setErr(''); setOk('');
    const items = baris.filter((r) => r.product_id && Number(r.qty) > 0);
    if (items.length === 0) return setErr('Pilih minimal satu barang dan isi jumlahnya');
    setSaving(true);
    try {
      await api('/api/barang-masuk', {
        method: 'POST',
        body: {
          supplier, catatan, catat_kas: catatKas,
          items: items.map((r) => ({ product_id: r.product_id, qty: Number(r.qty), harga_beli: Number(r.harga_beli || 0) })),
        },
      });
      setBaris([{ ...BARIS_KOSONG }]);
      setSupplier(''); setCatatan('');
      setOk('Barang masuk tersimpan dan stok sudah bertambah');
      muat(false);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Barang masuk" subtitle="Catat barang yang dibeli dari supplier. Stok bertambah otomatis." />

      <form onSubmit={simpan} className="card p-5 sm:p-6 space-y-5 max-w-3xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="supplier" className="label">Supplier (opsional)</label>
            <input id="supplier" className="input" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
          </div>
          <div>
            <label htmlFor="catatan" className="label">Catatan (opsional)</label>
            <input id="catatan" className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <span className="label">Barang yang masuk</span>
          {baris.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_90px_170px_44px] items-center">
              <select className="input" aria-label="Barang" value={r.product_id} onChange={(e) => pilihBarang(i, e.target.value)}>
                <option value="">Pilih barang</option>
                {produk.map((p) => <option key={p.id} value={p.id}>{p.nama} (stok {p.stok})</option>)}
              </select>
              <input className="input" aria-label="Jumlah" inputMode="numeric" value={r.qty}
                onChange={(e) => ubah(i, { qty: e.target.value.replace(/\D/g, '') })} />
              <RupiahInput ariaLabel="Harga beli per satuan" value={r.harga_beli} onChange={(v) => ubah(i, { harga_beli: v })} />
              <button type="button" aria-label="Hapus baris" className="btn btn-danger w-11 px-0"
                onClick={() => setBaris((b) => (b.length > 1 ? b.filter((_, idx) => idx !== i) : b))}>
                <Icon name="trash" size={18} />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setBaris((b) => [...b, { ...BARIS_KOSONG }])}>
            <Icon name="plus" size={18} /> Tambah baris
          </button>
        </div>

        <label className="flex items-center gap-3 min-h-[44px] text-sm font-semibold">
          <input type="checkbox" className="w-5 h-5 accent-[#2A3EB1]" checked={catatKas} onChange={(e) => setCatatKas(e.target.checked)} />
          Catat sebagai uang keluar di Kas
        </label>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-sm font-semibold text-muted">Total pembelian</span>
          <span className="text-2xl font-extrabold tracking-tight">{rupiah(total)}</span>
        </div>
        <Alert>{err}</Alert>
        <Sukses>{ok}</Sukses>
        <button type="submit" disabled={saving} className="btn btn-primary w-full min-h-[52px] text-base">
          {saving ? 'Menyimpan…' : 'Simpan barang masuk'}
        </button>
      </form>

      <section className="space-y-3 max-w-3xl">
        <h2 className="text-sm font-bold text-muted">Riwayat terakhir</h2>
        {riwayat.length === 0 && <p className="text-sm text-muted">Belum ada riwayat.</p>}
        {riwayat.map((r) => (
          <div key={r.id} className="card p-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-bold">{r.supplier || 'Tanpa supplier'}</div>
              <div className="text-xs text-muted mt-0.5">{tanggalWaktu(r.tanggal)} · {r.jumlah_item} jenis barang{r.catatan ? ` · ${r.catatan}` : ''}</div>
            </div>
            <div className="font-extrabold">{rupiah(r.total)}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default function BarangMasukPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
