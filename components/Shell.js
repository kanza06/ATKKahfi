'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { NAMA_TOKO } from '@/lib/config';
import { Icon } from '@/components/ui';

const UserCtx = createContext({ nama: '', role: 'kasir' });
export const useUser = () => useContext(UserCtx);

const MENU = [
  { href: '/kasir', label: 'Kasir', roles: ['admin', 'kasir'] },
  { href: '/produk', label: 'Produk', roles: ['admin', 'kasir'] },
  { href: '/kategori', label: 'Kategori', roles: ['admin'] },
  { href: '/barang-masuk', label: 'Barang masuk', roles: ['admin'] },
  { href: '/stok-habis', label: 'Stok habis', roles: ['admin', 'kasir'] },
  { href: '/kas', label: 'Kas', roles: ['admin'] },
  { href: '/laporan', label: 'Laporan', roles: ['admin'] },
  { href: '/pengguna', label: 'Pengguna', roles: ['admin'] },
];

export function AdminOnly({ children }) {
  const u = useUser();
  if (u.role !== 'admin') {
    return <div className="card p-6 text-sm text-muted">Halaman ini hanya bisa dibuka oleh admin.</div>;
  }
  return children;
}

export default function Shell({ user, children }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  useEffect(() => { setBuka(false); }, [pathname]);

  const items = MENU.filter((m) => m.roles.includes(user.role));

  async function keluar() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    window.location.href = '/login';
  }

  return (
    <UserCtx.Provider value={user}>
      <div className="min-h-screen lg:flex">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-ink text-white pl-4 pr-2 h-14">
          <span className="font-extrabold tracking-tight">{NAMA_TOKO}</span>
          <button type="button" aria-label={buka ? 'Tutup menu' : 'Buka menu'} onClick={() => setBuka(!buka)}
            className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10">
            <Icon name={buka ? 'close' : 'menu'} />
          </button>
        </header>

        {buka && <div className="lg:hidden fixed inset-0 z-20 bg-ink/50" onClick={() => setBuka(false)} />}

        <aside
          className={`${buka ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:sticky top-14 lg:top-0 left-0 z-30 h-[calc(100vh-3.5rem)] lg:h-screen w-64 shrink-0 bg-ink text-white flex flex-col gap-6 p-5 transition-transform`}>
          <div className="hidden lg:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent text-ink flex items-center justify-center">
              <Icon name="pencil" size={18} />
            </div>
            <div className="leading-tight">
              <div className="font-extrabold tracking-tight">{NAMA_TOKO}</div>
              <div className="text-xs text-[#A9B1D3]">{user.role === 'admin' ? 'Admin' : 'Kasir'}: {user.nama}</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto">
            {items.map((m) => {
              const aktif = pathname === m.href || pathname.startsWith(m.href + '/');
              return (
                <Link key={m.href} href={m.href}
                  className={`flex items-center min-h-[44px] px-3.5 rounded-xl text-[15px] ${aktif ? 'bg-brand text-white font-bold' : 'text-[#C9CFE6] hover:bg-white/10'}`}>
                  {m.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <div className="lg:hidden text-xs text-[#A9B1D3] px-1">{user.nama} ({user.role})</div>
            <button type="button" onClick={keluar}
              className="min-h-[44px] rounded-xl border border-white/20 text-sm font-semibold hover:bg-white/10">
              Keluar
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </UserCtx.Provider>
  );
}
