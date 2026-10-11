'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { angka, rupiah } from '@/lib/format';
import { AdminOnly } from '@/components/Shell';
import { Alert, Icon, Kosong, Modal, PageHeader, Sukses } from '@/components/ui';

function Isi() {
  const [data, setData] = useState({ kategori: [], total: null });
  const [nama, setNama] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [ubah, setUbah] = useState(null);
  const [hapus, setHapus] = useState(null);

  const muat = useCallback(async () => {
    try {
      setData(await api('/api/kategori'));
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  async function tambah(e) {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await api('/api/kategori', { method: 'POST', body: { nama } });
      setNama('');
      setOk('Kategori ditambahkan');
      muat();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function simpanUbah() {
    setErr(''); setOk('');
    try {
      await api(`/api/kategori/${ubah.id}`, { method: 'PUT', body: { nama: ubah.nama } });
      setUbah(null);
      muat();
    } catch (e) {
      setErr(e.message);
      setUbah(null);
    }
  }

  async function konfirmasiHapus() {
    setErr(''); setOk('');
    try {
      await api(`/api/kategori/${hapus.id}`, { method: 'DELETE' });
      setOk('Kategori dihapus');
      muat();
    } catch (e) {
      setErr(e.message);
    }
    setHapus(null);
  }

  const t = data.total;
  return (
    <div className="space-y-6">
      <PageHeader title="Kategori" subtitle="Kelompokkan barang dan lihat nilai barang di setiap kategori." />

      {t && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <div className="text-sm font-semibold text-muted">Total nilai barang</div>
            <div className="text-2xl font-extrabold tracking-tight mt-1">{rupiah(t.nilai_modal)}</div>
            <div className="text-xs text-muted mt-1">Stok × harga beli</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold text-muted">Nilai jika semua terjual</div>
            <div className="text-2xl font-extrabold tracking-tight mt-1">{rupiah(t.nilai_jual)}</div>
            <div className="text-xs text-muted mt-1">Stok × harga jual</div>
          </div>
          <div className="card p-5">
            <div className="text-sm font-semibold text-muted">Jenis barang</div>
            <div className="text-2xl font-extrabold tracking-tight mt-1">{angka(t.jumlah_barang)}</div>
            <div className="text-xs text-muted mt-1">{angka(t.total_stok)} unit di stok</div>
          </div>
        </div>
      )}

      <form onSubmit={tambah} className="card p-5 max-w-xl space-y-3">
        <div className="text-lg font-extrabold">Kategori baru</div>
        <div>
          <label htmlFor="nama-kat" className="label">Nama kategori</label>
          <input id="nama-kat" className="input" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Perlengkapan Meja" />
        </div>
        <Alert>{err}</Alert>
        <Sukses>{ok}</Sukses>
        <button type="submit" className="btn btn-primary w-full min-h-[48px]" disabled={!nama.trim()}>Tambah kategori</button>
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-muted">Daftar kategori</h2>
        {data.kategori.length === 0 && <Kosong>Belum ada kategori.</Kosong>}
        {data.kategori.map((k) => (
          <div key={k.id} className="card p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex-1 min-w-[160px]">
              <div className="font-bold">{k.nama}</div>
              <div className="text-xs text-muted mt-0.5">{angka(k.jumlah_barang)} jenis barang · {angka(k.total_stok)} unit</div>
            </div>
            <div className="text-right">
              <div className="font-extrabold">{rupiah(k.nilai_modal)}</div>
              <div className="text-xs text-muted">Jual {rupiah(k.nilai_jual)}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label={`Ubah ${k.nama}`} className="btn btn-ghost w-11 px-0" onClick={() => setUbah({ id: k.id, nama: k.nama })}><Icon name="edit" size={18} /></button>
              <button type="button" aria-label={`Hapus ${k.nama}`} className="btn btn-danger w-11 px-0" onClick={() => setHapus(k)}><Icon name="trash" size={18} /></button>
            </div>
          </div>
        ))}
        <p className="text-xs text-muted leading-relaxed">Kategori yang masih berisi barang tidak bisa dihapus. Pindahkan barangnya ke kategori lain terlebih dahulu.</p>
      </section>

      <Modal open={Boolean(ubah)} title="Ubah nama kategori" onClose={() => setUbah(null)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setUbah(null)}>Batal</button>
            <button type="button" className="btn btn-primary" onClick={simpanUbah}>Simpan</button>
          </>
        )}>
        <label htmlFor="ubah-kat" className="label">Nama kategori</label>
        <input id="ubah-kat" className="input" value={ubah?.nama || ''} onChange={(e) => setUbah({ ...ubah, nama: e.target.value })} />
      </Modal>

      <Modal open={Boolean(hapus)} title="Hapus kategori?" onClose={() => setHapus(null)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapus(null)}>Batal</button>
            <button type="button" className="btn btn-danger-solid" onClick={konfirmasiHapus}>Ya, hapus</button>
          </>
        )}>
        <p className="text-sm text-muted">Kategori "{hapus?.nama}" akan dihapus.</p>
      </Modal>
    </div>
  );
}

export default function KategoriPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
