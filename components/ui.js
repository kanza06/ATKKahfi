'use client';
import { useEffect } from 'react';

const PATHS = {
  plus: 'M12 5v14M5 12h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  camera: 'M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2zM12 10a3.5 3.5 0 100 7 3.5 3.5 0 000-7z',
  image: 'M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM9 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 18l5-5 4 4 3-3 4 4',
  edit: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  pencil: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
};

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-extrabold mb-4">{title}</h2>
        {children}
        {footer && <div className="mt-5 flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl lg:text-[28px] font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-xl bg-[#FDE8E4] text-[#A8321F] px-4 py-3 text-sm font-semibold">
      {children}
    </div>
  );
}

export function Sukses({ children }) {
  if (!children) return null;
  return (
    <div role="status" className="rounded-xl bg-[#E3F4EC] text-[#17694A] px-4 py-3 text-sm font-semibold">
      {children}
    </div>
  );
}

export function Chip({ aktif, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={`min-h-[44px] px-4 rounded-full text-sm font-semibold border transition ${aktif ? 'bg-ink text-white border-ink' : 'bg-white border-line text-ink hover:bg-surface'}`}>
      {children}
    </button>
  );
}

export function StokBadge({ stok, min }) {
  let cls = 'bg-[#F1F2F7] text-muted';
  let teks = `Stok ${stok}`;
  if (stok <= 0) { cls = 'bg-[#FDE8E4] text-[#A8321F]'; teks = 'Habis'; }
  else if (stok <= min) { cls = 'bg-[#FFF1CC] text-[#7A4B00]'; teks = `Menipis · ${stok}`; }
  return <span className={`inline-block text-xs font-bold rounded-lg px-2.5 py-1 ${cls}`}>{teks}</span>;
}

export function Kosong({ children }) {
  return <div className="card p-8 text-center text-sm text-muted">{children}</div>;
}

export function FotoBarang({ src, className = '' }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-brand-soft text-muted ${className}`}>
      <Icon name="image" size={28} />
    </div>
  );
}
