'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { rupiah, tanggalWaktu, namaBulan } from '@/lib/format';
import { AdminOnly } from '@/components/Shell';
import RupiahInput from '@/components/RupiahInput';
import { Alert, Icon, Kosong, Modal, PageHeader, Sukses } from '@/components/ui';

const KAT_MASUK = ['Modal', 'Setoran', 'Lainnya'];
const KAT_KELUAR = ['Gaji', 'Listrik', 'Sewa', 'Transport', 'Beli stok', 'Lainnya'];

function Isi() {
  const [bulan, setBulan] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [tipe, setTipe] = useState('keluar');
  const [kategori, setKategori] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');
  const [modalSaldo, setModalSaldo] = useState(false);
  const [saldoBaru, setSaldoBaru] = useState('');

  const muat = useCallback(async () => {
    try {
      const d = await api('/api/kas' + (bulan ? `?bulan=${bulan}` : ''));
      setData(d);
      if (!bulan) setBulan(d.bulan);
    } catch (e) {
      setErr(e.message);
    }
  }, [bulan]);
  useEffect(() => { muat(); }, [muat]);

  async function tambah(e) {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await api('/api/kas', { method: 'POST', body: { tipe, kategori, jumlah, catatan } });
      setJumlah(''); setCatatan(''); setKategori('');
      setOk('Catatan kas tersimpan');
      muat();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function hapus(id) {
    setErr(''); setOk('');
    try {
      await api(`/api/kas?id=${id}`, { method: 'DELETE' });
      muat();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function simpanSaldo() {
    setErr(''); setOk('');
    try {
      await api('/api/kas/saldo', { method: 'PUT', body: { saldo: saldoBaru === '' ? 0 : saldoBaru } });
      setModalSaldo(false);
      setOk('Saldo toko diperbarui');
      muat();
    } catch (e) {
      setErr(e.message);
      setModalSaldo(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kas" subtitle="Saldo toko dan catatan uang masuk serta keluar." />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 md:col-span-1 bg-ink text-white border-ink">
          <div className="text-sm font-semibold text-[#A9B1D3]">Saldo toko (uang yang ada)</div>
          <div className="text-3xl font-extrabold tracking-tight mt-1">{rupiah(data?.saldo)}</div>
          <button type="button" className="btn mt-4 bg-white/10 text-white hover:bg-white/20 w-full"
            onClick={() => { setSaldoBaru(data?.saldo ?? ''); setModalSaldo(true); }}>
            Atur saldo
          </button>
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold text-muted">Uang masuk · {bulan ? namaBulan(bulan) : ''}</div>
          <div className="text-2xl font-extrabold tracking-tight mt-1 text-[#17694A]">{rupiah(data?.masuk_bulan)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm font-semibold text-muted">Uang keluar · {bulan ? namaBulan(bulan) : ''}</div>
          <div className="text-2xl font-extrabold tracking-tight mt-1 text-[#A8321F]">{rupiah(data?.keluar_bulan)}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] items-start">
        <form onSubmit={tambah} className="card p-5 space-y-4">
          <div className="text-lg font-extrabold">Catat kas</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setTipe('keluar')}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border ${tipe === 'keluar' ? 'bg-ink text-white border-ink' : 'bg-white border-[#D5D9E8]'}`}>Uang keluar</button>
            <button type="button" onClick={() => setTipe('masuk')}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold border ${tipe === 'masuk' ? 'bg-ink text-white border-ink' : 'bg-white border-[#D5D9E8]'}`}>Uang masuk</button>
          </div>
          <div>
            <label htmlFor="kas-kat" className="label">Kategori</label>
            <input id="kas-kat" list="kas-kat-list" className="input" value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="Pilih atau ketik sendiri" />
            <datalist id="kas-kat-list">{(tipe === 'masuk' ? KAT_MASUK : KAT_KELUAR).map((k) => <option key={k} value={k} />)}</datalist>
          </div>
          <div>
            <label htmlFor="kas-jumlah" className="label">Jumlah</label>
            <RupiahInput id="kas-jumlah" value={jumlah} onChange={setJumlah} />
          </div>
          <div>
            <label htmlFor="kas-catatan" className="label">Catatan (opsional)</label>
            <input id="kas-catatan" className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>
          <Alert>{err}</Alert>
          <Sukses>{ok}</Sukses>
          <button type="submit" className="btn btn-primary w-full min-h-[48px]" disabled={!jumlah}>Simpan catatan</button>
        </form>

        <section className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Riwayat kas</h2>
            <div>
              <label htmlFor="kas-bulan" className="sr-only">Pilih bulan</label>
              <input id="kas-bulan" type="month" className="input w-auto" value={bulan} onChange={(e) => setBulan(e.target.value)} />
            </div>
          </div>
          {data && data.entries.length === 0 && <Kosong>Belum ada catatan di bulan ini.</Kosong>}
          {data?.entries.map((k) => (
            <div key={k.id} className="card p-3 sm:p-4 flex items-center gap-3">
              <div className={`w-2 self-stretch rounded-full ${k.tipe === 'masuk' ? 'bg-[#17694A]' : 'bg-[#A8321F]'}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="font-bold">{k.kategori}</div>
                <div className="text-xs text-muted mt-0.5 truncate">{tanggalWaktu(k.tanggal)}{k.catatan ? ` · ${k.catatan}` : ''}</div>
              </div>
              <div className={`font-extrabold ${k.tipe === 'masuk' ? 'text-[#17694A]' : 'text-[#A8321F]'}`}>
                {k.tipe === 'masuk' ? '+' : '-'}{rupiah(k.jumlah)}
              </div>
              {!k.sale_id && !k.purchase_id && (
                <button type="button" aria-label="Hapus catatan" className="btn btn-danger w-11 px-0" onClick={() => hapus(k.id)}>
                  <Icon name="trash" size={18} />
                </button>
              )}
            </div>
          ))}
        </section>
      </div>

      <Modal open={modalSaldo} title="Atur saldo toko" onClose={() => setModalSaldo(false)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setModalSaldo(false)}>Batal</button>
            <button type="button" className="btn btn-primary" onClick={simpanSaldo}>Simpan saldo</button>
          </>
        )}>
        <p className="text-sm text-muted mb-3 leading-relaxed">Isi jumlah seluruh uang toko yang ada saat ini. Setelah itu saldo bertambah dan berkurang otomatis dari penjualan dan catatan kas.</p>
        <label htmlFor="saldo-baru" className="label">Saldo toko</label>
        <RupiahInput id="saldo-baru" value={saldoBaru} onChange={setSaldoBaru} />
      </Modal>
    </div>
  );
}

export default function KasPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
