'use client';
import { angka } from '@/lib/format';

// value: angka atau '' ; onChange menerima angka atau ''
export default function RupiahInput({ id, value, onChange, placeholder = '0', ariaLabel }) {
  const teks = value === '' || value == null ? '' : angka(value);
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">Rp</span>
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        className="input pl-10"
        placeholder={placeholder}
        value={teks}
        onChange={(e) => {
          const d = e.target.value.replace(/\D/g, '');
          onChange(d === '' ? '' : Number(d));
        }}
      />
    </div>
  );
}
