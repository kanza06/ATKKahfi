'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { AdminOnly, useUser } from '@/components/Shell';
import { Alert, Icon, Modal, PageHeader, Sukses } from '@/components/ui';

function Isi() {
  const me = useUser();
  const [list, setList] = useState([]);
  const [f, setF] = useState({ nama: '', username: '', password: '', role: 'kasir' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [hapus, setHapus] = useState(null);
  const [reset, setReset] = useState(null);
  const [passBaru, setPassBaru] = useState('');

  const muat = useCallback(async () => {
    try {
      setList((await api('/api/pengguna')).pengguna);
    } catch (e) {
      setErr(e.message);
    }
  }, []);
  useEffect(() => { muat(); }, [muat]);

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  async function tambah(e) {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await api('/api/pengguna', { method: 'POST', body: f });
      setF({ nama: '', username: '', password: '', role: 'kasir' });
      setOk('Pengguna ditambahkan');
      muat();
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function konfirmasiHapus() {
    setErr(''); setOk('');
    try {
      await api(`/api/pengguna?id=${hapus.id}`, { method: 'DELETE' });
      muat();
    } catch (e) {
      setErr(e.message);
    }
    setHapus(null);
  }

  async function simpanPassword() {
    setErr(''); setOk('');
    try {
      await api('/api/pengguna', { method: 'PUT', body: { id: reset.id, password: passBaru } });
      setOk(`Password ${reset.nama} diganti`);
    } catch (e) {
      setErr(e.message);
    }
    setReset(null);
    setPassBaru('');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengguna" subtitle="Admin boleh mengelola semua menu. Kasir hanya memakai kasir dan melihat stok." />

      <form onSubmit={tambah} className="card p-5 max-w-xl space-y-4">
        <div className="text-lg font-extrabold">Pengguna baru</div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-nama" className="label">Nama</label>
            <input id="p-nama" className="input" value={f.nama} onChange={(e) => set('nama', e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-user" className="label">Username</label>
            <input id="p-user" className="input" autoCapitalize="none" value={f.username} onChange={(e) => set('username', e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-pass" className="label">Password (min. 6 karakter)</label>
            <input id="p-pass" type="password" className="input" value={f.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          <div>
            <label htmlFor="p-role" className="label">Peran</label>
            <select id="p-role" className="input" value={f.role} onChange={(e) => set('role', e.target.value)}>
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <Alert>{err}</Alert>
        <Sukses>{ok}</Sukses>
        <button type="submit" className="btn btn-primary w-full min-h-[48px]">Tambah pengguna</button>
      </form>

      <section className="space-y-3 max-w-xl">
        {list.map((u) => (
          <div key={u.id} className="card p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[140px]">
              <div className="font-bold">{u.nama}</div>
              <div className="text-xs text-muted mt-0.5">@{u.username} · {u.role === 'admin' ? 'Admin' : 'Kasir'}</div>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => { setReset(u); setPassBaru(''); }}>Ganti password</button>
            {u.id !== me.id && (
              <button type="button" aria-label={`Hapus ${u.nama}`} className="btn btn-danger w-11 px-0" onClick={() => setHapus(u)}>
                <Icon name="trash" size={18} />
              </button>
            )}
          </div>
        ))}
      </section>

      <Modal open={Boolean(reset)} title="Ganti password" onClose={() => setReset(null)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setReset(null)}>Batal</button>
            <button type="button" className="btn btn-primary" onClick={simpanPassword}>Simpan</button>
          </>
        )}>
        <label htmlFor="pass-baru" className="label">Password baru untuk {reset?.nama}</label>
        <input id="pass-baru" type="password" className="input" value={passBaru} onChange={(e) => setPassBaru(e.target.value)} />
      </Modal>

      <Modal open={Boolean(hapus)} title="Hapus pengguna?" onClose={() => setHapus(null)}
        footer={(
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setHapus(null)}>Batal</button>
            <button type="button" className="btn btn-danger-solid" onClick={konfirmasiHapus}>Ya, hapus</button>
          </>
        )}>
        <p className="text-sm text-muted">Akun "{hapus?.nama}" tidak bisa login lagi. Riwayat transaksinya tetap tersimpan.</p>
      </Modal>
    </div>
  );
}

export default function PenggunaPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
