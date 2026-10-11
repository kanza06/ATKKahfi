'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { rupiah } from '@/lib/format';
import RupiahInput from '@/components/RupiahInput';
import { Alert, Chip, FotoBarang, Modal, PageHeader, StokBadge } from '@/components/ui';

const METODE = [
  { id: 'tunai', label: 'Tunai' },
  { id: 'qris', label: 'QRIS' },
  { id: 'transfer', label: 'Transfer' },
];

export default function KasirPage() {
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [q, setQ] = useState('');
  const [kat, setKat] = useState('');
  const [keranjang, setKeranjang] = useState([]);
  const [metode, setMetode] = useState('tunai');
  const [bayar, setBayar] = useState('');
  const [err, setErr] = useState('');
  const [proses, setProses] = useState(false);
  const [selesai, setSelesai] = useState(null);

  const muat = useCallback(async () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (kat) p.set('kategori', kat);
    try {
      const d = await api('/api/produk?' + p.toString());
      setProduk(d.produk);
    } catch (e) {
      setErr(e.message);
    }
  }, [q, kat]);

  useEffect(() => {
    const t = setTimeout(muat, 250);
    return () => clearTimeout(t);
  }, [muat]);

  useEffect(() => {
    api('/api/kategori').then((d) => setKategori(d.kategori)).catch(() => {});
  }, []);

  function tambah(p) {
    setErr('');
    setKeranjang((k) => {
      const ada = k.find((i) => i.id === p.id);
      if (ada) {
        if (ada.qty >= p.stok) return k;
        return k.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...k, { id: p.id, nama: p.nama, harga: p.harga_jual, stok: p.stok, qty: 1 }];
    });
  }

  function ubahQty(id, d) {
    setKeranjang((k) =>
      k.map((i) => (i.id === id ? { ...i, qty: Math.min(i.stok, i.qty + d) } : i)).filter((i) => i.qty > 0));
  }

  const total = keranjang.reduce((s, i) => s + i.harga * i.qty, 0);
  const diterima = metode === 'tunai' ? Number(bayar || 0) : total;
  const kembalian = Math.max(0, diterima - total);
  const bisaBayar = keranjang.length > 0 && diterima >= total && !proses;

  async function simpan() {
    setErr('');
    setProses(true);
    try {
      const d = await api('/api/kasir', {
        method: 'POST',
        body: { items: keranjang.map((i) => ({ product_id: i.id, qty: i.qty })), metode, bayar: diterima },
      });
      setSelesai(d);
      setKeranjang([]);
      setBayar('');
      muat();
    } catch (e) {
      setErr(e.message);
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader title="Kasir" subtitle="Ketuk barang untuk menambahkannya ke transaksi." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <section className="space-y-4 min-w-0">
          <input className="input" aria-label="Cari barang atau barcode" placeholder="Cari nama atau barcode"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Chip aktif={kat === ''} onClick={() => setKat('')}>Semua</Chip>
            {kategori.map((k) => (
              <Chip key={k.id} aktif={String(kat) === String(k.id)} onClick={() => setKat(String(k.id))}>{k.nama}</Chip>
            ))}
          </div>
          <Alert>{err}</Alert>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {produk.map((p) => (
              <button key={p.id} type="button" disabled={p.stok <= 0} onClick={() => tambah(p)}
                className="card p-3 text-left flex flex-col gap-2 transition hover:border-brand disabled:opacity-60 disabled:hover:border-line">
                <FotoBarang src={p.gambar} className="w-full h-28 rounded-xl" />
                <div className="font-bold text-sm leading-snug min-h-[2.5rem]">{p.nama}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-sm">{rupiah(p.harga_jual)}</span>
                  <StokBadge stok={p.stok} min={p.stok_min} />
                </div>
              </button>
            ))}
          </div>
          {produk.length === 0 && !err && (
            <p className="text-sm text-muted">Barang tidak ditemukan. Tambahkan barang lewat menu Produk.</p>
          )}
        </section>

        <aside id="keranjang" className="card p-5 space-y-4 lg:sticky lg:top-6">
          <div className="text-lg font-extrabold tracking-tight">Transaksi baru</div>

          {keranjang.length === 0 ? (
            <p className="text-sm text-muted">Belum ada barang. Ketuk barang di daftar untuk menambah.</p>
          ) : (
            <ul className="divide-y divide-line">
              {keranjang.map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{i.nama}</div>
                    <div className="text-xs text-muted mt-0.5">{i.qty} × {rupiah(i.harga)} = {rupiah(i.qty * i.harga)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" aria-label={`Kurangi ${i.nama}`} onClick={() => ubahQty(i.id, -1)}
                      className="w-11 h-11 rounded-xl border border-[#D5D9E8] text-lg font-bold">−</button>
                    <button type="button" aria-label={`Tambah ${i.nama}`} onClick={() => ubahQty(i.id, 1)}
                      disabled={i.qty >= i.stok}
                      className="w-11 h-11 rounded-xl border border-[#D5D9E8] text-lg font-bold disabled:opacity-40">+</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted">Total</span>
            <span className="text-2xl font-extrabold tracking-tight">{rupiah(total)}</span>
          </div>

          <div>
            <span className="label">Metode bayar</span>
            <div className="flex gap-2">
              {METODE.map((m) => (
                <button key={m.id} type="button" onClick={() => setMetode(m.id)}
                  className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border ${metode === m.id ? 'bg-ink text-white border-ink' : 'bg-white border-[#D5D9E8]'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {metode === 'tunai' && (
            <div>
              <label htmlFor="uang" className="label">Uang diterima</label>
              <RupiahInput id="uang" value={bayar} onChange={setBayar} />
              <button type="button" className="btn btn-ghost mt-2 w-full" onClick={() => setBayar(total)} disabled={total === 0}>
                Uang pas
              </button>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-[#E3F4EC] text-[#17694A] px-4 py-3">
            <span className="text-sm font-semibold">Kembalian</span>
            <span className="text-lg font-extrabold">{rupiah(kembalian)}</span>
          </div>

          <button type="button" disabled={!bisaBayar} onClick={simpan} className="btn btn-primary w-full min-h-[54px] text-base">
            {proses ? 'Menyimpan…' : 'Bayar & simpan'}
          </button>
          {keranjang.length > 0 && (
            <button type="button" className="btn w-full text-[#A8321F]" onClick={() => { setKeranjang([]); setBayar(''); }}>
              Batalkan transaksi
            </button>
          )}
        </aside>
      </div>

      {keranjang.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 p-3 bg-white border-t border-line">
          <a href="#keranjang" className="btn btn-primary w-full min-h-[52px] text-base">
            Lihat keranjang · {rupiah(total)}
          </a>
        </div>
      )}

      <Modal open={Boolean(selesai)} title="Transaksi berhasil" onClose={() => setSelesai(null)}
        footer={<button type="button" className="btn btn-primary w-full" onClick={() => setSelesai(null)}>Transaksi baru</button>}>
        {selesai && (
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Nomor</dt><dd className="font-semibold">{selesai.nomor}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-semibold">{rupiah(selesai.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Diterima</dt><dd className="font-semibold">{rupiah(selesai.bayar)}</dd></div>
            <div className="flex justify-between text-base"><dt className="font-semibold">Kembalian</dt><dd className="font-extrabold text-[#17694A]">{rupiah(selesai.kembalian)}</dd></div>
          </dl>
        )}
      </Modal>
    </div>
  );
}
