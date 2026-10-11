'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { useUser } from '@/components/Shell';
import { Alert, FotoBarang, Kosong, PageHeader, StokBadge } from '@/components/ui';

function Baris({ p, admin }) {
  return (
    <div className="card p-3 sm:p-4 flex flex-wrap items-center gap-x-4 gap-y-3">
      <FotoBarang src={p.gambar} className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 min-w-[160px]">
        <div className="font-bold">{p.nama}</div>
        <div className="text-xs text-muted mt-0.5">{p.kategori || 'Tanpa kategori'} · batas menipis {p.stok_min}</div>
      </div>
      <StokBadge stok={p.stok} min={p.stok_min} />
      {admin && <Link href={`/barang-masuk?produk=${p.id}`} className="btn btn-primary">Tambah stok</Link>}
    </div>
  );
}

export default function StokHabisPage() {
  const user = useUser();
  const admin = user.role === 'admin';
  const [produk, setProduk] = useState([]);
  const [err, setErr] = useState('');
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    api('/api/produk?status=kurang').then((d) => setProduk(d.produk)).catch((e) => setErr(e.message));
  }, []);

  const habis = produk.filter((p) => p.stok <= 0);
  const menipis = produk.filter((p) => p.stok > 0);

  async function salin() {
    const teks = produk.map((p) => `- ${p.nama} (stok ${p.stok})`).join('\n');
    try {
      await navigator.clipboard.writeText(teks);
      setPesan('Daftar belanja disalin');
    } catch {
      setPesan('Daftar tidak bisa disalin otomatis');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Stok habis" subtitle="Barang yang habis atau hampir habis, untuk daftar belanja.">
        {produk.length > 0 && <button type="button" className="btn btn-ghost min-h-[48px]" onClick={salin}>Salin daftar belanja</button>}
      </PageHeader>
      <Alert>{err}</Alert>
      {pesan && <p className="text-sm font-semibold text-[#17694A]">{pesan}</p>}
      {produk.length === 0 && !err && <Kosong>Semua stok aman. Tidak ada barang yang habis atau menipis.</Kosong>}

      {habis.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted">Habis ({habis.length})</h2>
          {habis.map((p) => <Baris key={p.id} p={p} admin={admin} />)}
        </section>
      )}
      {menipis.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-muted">Menipis ({menipis.length})</h2>
          {menipis.map((p) => <Baris key={p.id} p={p} admin={admin} />)}
        </section>
      )}
    </div>
  );
}
