'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import RupiahInput from '@/components/RupiahInput';
import { Alert, Icon, FotoBarang } from '@/components/ui';
import { api, resizeImage } from '@/lib/client';

const SATUAN = ['pcs', 'lusin', 'rim', 'box', 'pak', 'set', 'lembar', 'roll', 'buah'];

export default function ProdukForm({ produk }) {
  const router = useRouter();
  const edit = Boolean(produk);
  const kameraRef = useRef(null);
  const galeriRef = useRef(null);

  const [f, setF] = useState({
    nama: produk?.nama || '',
    category_id: produk?.category_id ?? '',
    barcode: produk?.barcode || '',
    satuan: produk?.satuan || 'pcs',
    harga_beli: produk?.harga_beli ?? '',
    harga_jual: produk?.harga_jual ?? '',
    stok: produk?.stok ?? 0,
    stok_min: produk?.stok_min ?? 0,
  });
  const [gambar, setGambar] = useState(produk?.gambar || null);
  const [gambarBaru, setGambarBaru] = useState(null);
  const [hapusGambar, setHapusGambar] = useState(false);
  const [kategori, setKategori] = useState([]);
  const [katBaru, setKatBaru] = useState('');
  const [tampilKat, setTampilKat] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    api('/api/kategori').then((d) => setKategori(d.kategori)).catch((e) => setErr(e.message));
  }, []);

  async function pilihFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = await resizeImage(file);
      setGambar(data);
      setGambarBaru(data);
      setHapusGambar(false);
      setErr('');
    } catch (e2) {
      setErr(e2.message);
    }
  }

  function buangFoto() {
    setGambar(null);
    setGambarBaru(null);
    setHapusGambar(true);
  }

  async function tambahKategori() {
    const nama = katBaru.trim();
    if (!nama) return;
    try {
      const k = await api('/api/kategori', { method: 'POST', body: { nama } });
      setKategori((list) => [...list, { id: k.id, nama: k.nama }].sort((a, b) => a.nama.localeCompare(b.nama)));
      set('category_id', k.id);
      setKatBaru('');
      setTampilKat(false);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function simpan(e) {
    e.preventDefault();
    setErr('');
    if (!f.nama.trim()) return setErr('Nama barang wajib diisi');
    if (f.harga_jual === '') return setErr('Harga jual wajib diisi');
    setSaving(true);
    try {
      const body = {
        ...f,
        category_id: f.category_id || null,
        harga_beli: Number(f.harga_beli || 0),
        harga_jual: Number(f.harga_jual),
        stok: Number(f.stok || 0),
        stok_min: Number(f.stok_min || 0),
      };
      if (gambarBaru) body.gambar = gambarBaru;
      if (hapusGambar && !gambarBaru) body.hapus_gambar = true;
      if (edit) await api(`/api/produk/${produk.id}`, { method: 'PUT', body });
      else await api('/api/produk', { method: 'POST', body });
      router.push('/produk');
      router.refresh();
    } catch (e2) {
      setErr(e2.message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={simpan} className="card p-5 sm:p-7 space-y-5 max-w-2xl">
      <Alert>{err}</Alert>

      <div>
        <span className="label">Foto barang</span>
        <div className="flex flex-wrap items-center gap-4">
          <FotoBarang src={gambar} className="w-36 h-36 rounded-2xl border-2 border-dashed border-[#8F9DE6]" />
          <div className="flex flex-col gap-2">
            <button type="button" className="btn btn-primary" onClick={() => kameraRef.current?.click()}>
              <Icon name="camera" size={18} /> Ambil foto
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => galeriRef.current?.click()}>
              Pilih dari galeri
            </button>
            {gambar && (
              <button type="button" className="btn btn-danger" onClick={buangFoto}>Hapus foto</button>
            )}
          </div>
        </div>
        {/* capture="environment" membuka kamera bawaan HP */}
        <input ref={kameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pilihFoto} />
        <input ref={galeriRef} type="file" accept="image/*" className="hidden" onChange={pilihFoto} />
        <p className="text-xs text-muted mt-2">Foto dikecilkan otomatis agar hemat ruang.</p>
      </div>

      <div>
        <label htmlFor="nama" className="label">Nama barang</label>
        <input id="nama" className="input" value={f.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Contoh: Pulpen Gel 0,5 mm" />
      </div>

      <div>
        <label htmlFor="kategori" className="label">Kategori</label>
        <div className="flex gap-2">
          <select id="kategori" className="input flex-1" value={f.category_id} onChange={(e) => set('category_id', e.target.value)}>
            <option value="">Tanpa kategori</option>
            {kategori.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>
          <button type="button" className="btn btn-ghost" onClick={() => setTampilKat(!tampilKat)}>+ Baru</button>
        </div>
        {tampilKat && (
          <div className="flex gap-2 mt-2">
            <input className="input flex-1" aria-label="Nama kategori baru" placeholder="Nama kategori baru" value={katBaru} onChange={(e) => setKatBaru(e.target.value)} />
            <button type="button" className="btn btn-primary" onClick={tambahKategori}>Simpan</button>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="barcode" className="label">Barcode (opsional)</label>
          <input id="barcode" className="input" value={f.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="Ketik atau scan dengan alat scanner" />
        </div>
        <div>
          <label htmlFor="satuan" className="label">Satuan</label>
          <input id="satuan" list="daftar-satuan" className="input" value={f.satuan} onChange={(e) => set('satuan', e.target.value)} />
          <datalist id="daftar-satuan">{SATUAN.map((s) => <option key={s} value={s} />)}</datalist>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hbeli" className="label">Harga beli</label>
          <RupiahInput id="hbeli" value={f.harga_beli} onChange={(v) => set('harga_beli', v)} />
        </div>
        <div>
          <label htmlFor="hjual" className="label">Harga jual</label>
          <RupiahInput id="hjual" value={f.harga_jual} onChange={(v) => set('harga_jual', v)} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="stok" className="label">{edit ? 'Stok saat ini' : 'Stok awal'}</label>
          <input id="stok" inputMode="numeric" className="input" value={f.stok}
            onChange={(e) => set('stok', e.target.value.replace(/\D/g, ''))} />
        </div>
        <div>
          <label htmlFor="stokmin" className="label">Batas stok menipis</label>
          <input id="stokmin" inputMode="numeric" className="input" value={f.stok_min}
            onChange={(e) => set('stok_min', e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.push('/produk')}>Batal</button>
        <button type="submit" disabled={saving} className="btn btn-primary flex-1 min-h-[52px] text-base">
          {saving ? 'Menyimpan…' : 'Simpan barang'}
        </button>
      </div>
    </form>
  );
}
