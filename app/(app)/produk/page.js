'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { rupiah } from '@/lib/format';
import { useUser } from '@/components/Shell';
import { Alert, Chip, FotoBarang, Icon, Kosong, Modal, PageHeader, StokBadge } from '@/components/ui';

export default function ProdukPage() {
  const user = useUser();
  const admin = user.role === 'admin';
  const [produk, setProduk] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [q, setQ] = useState('');
  const [kat, setKat] = useState('');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');
  const [hapus, setHapus] = useState(null);
  const [menghapus, setMenghapus] = useState(false);

  const muat = useCallback(async () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (kat) p.set('kategori', kat);
    if (status) p.set('status', status);
    try {
      const d = await api('/api/produk?' + p.toString());
      setProduk(d.produk);
      setErr('');
    } catch (e) {
      setErr(e.message);
    }
  }, [q, kat, status]);

  useEffect(() => {
    const t = setTimeout(muat, 250);
    return () => clearTimeout(t);
  }, [muat]);

  useEffect(() => {
    api('/api/kategori').then((d) => setKategori(d.kategori)).catch(() => {});
  }, []);

  async function konfirmasiHapus() {
    setMenghapus(true);
    try {
      await api(`/api/produk/${hapus.id}`, { method: 'DELETE' });
      setHapus(null);
      await muat();
    } catch (e) {
      setErr(e.message);
      setHapus(null);
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div>
      <PageHeader title="Produk" subtitle="Kelola data barang: foto, nama, harga, dan stok.">
        {admin && (
          <>
            <Link href="/kategori" className="btn btn-ghost min-h-[48px]">Kelola kategori</Link>
            <Link href="/produk/tambah" className="btn btn-primary min-h-[48px]"><Icon name="plus" size={18} /> Tambah barang</Link>
          </>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input className="input flex-1 min-w-[220px]" aria-label="Cari barang" placeholder="Cari nama atau barcode"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" aria-label="Filter kategori" value={kat} onChange={(e) => setKat(e.target.value)}>
          <option value="">Semua kategori</option>
          {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        <Chip aktif={status === ''} onClick={() => setStatus('')}>Semua</Chip>
        <Chip aktif={status === 'kurang'} onClick={() => setStatus('kurang')}>Menipis</Chip>
        <Chip aktif={status === 'habis'} onClick={() => setStatus('habis')}>Habis</Chip>
      </div>

      <div className="space-y-3">
        <Alert>{err}</Alert>
        {produk.length === 0 && !err && <Kosong>Belum ada barang yang cocok.{admin ? ' Ketuk "Tambah barang" untuk mulai.' : ''}</Kosong>}
        {produk.map((p) => (
          <div key={p.id} className="card p-3 sm:p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
            <FotoBarang src={p.gambar} className="w-16 h-16 rounded-xl shrink-0" />
            <div className="flex-1 min-w-[160px]">
              <div className="font-bold">{p.nama}</div>
              <div className="text-xs text-muted mt-0.5">{p.kategori || 'Tanpa kategori'}{p.barcode ? ` · ${p.barcode}` : ''}</div>
            </div>
            <div className="text-right">
              <div className="font-extrabold">{rupiah(p.harga_jual)}</div>
              {admin && <div className="text-xs text-muted">Beli {rupiah(p.harga_beli)}</div>}
            </div>
            <StokBadge stok={p.stok} min={p.stok_min} />
            {admin && (
              <div className="flex gap-2">
                <Link href={`/produk/${p.id}`} className="btn btn-ghost">Edit</Link>
                <button type="button" className="btn btn-danger" onClick={() => setHapus(p)}>Hapus</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={Boolean(hapus)} title="Hapus barang?" onClose={() => setHapus(null)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapus(null)}>Batal</button>
            <button type="button" className="btn btn-danger-solid" disabled={menghapus} onClick={konfirmasiHapus}>Ya, hapus</button>
          </>
        )}>
        <p className="text-sm text-muted leading-relaxed">
          "{hapus?.nama}" tidak akan muncul lagi di kasir. Riwayat penjualannya tetap tersimpan.
        </p>
      </Modal>
    </div>
  );
}
