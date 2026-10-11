const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function angka(n) {
  const v = Math.round(Number(n) || 0);
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (v < 0 ? '-' : '') + s;
}

export function rupiah(n) {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? '-Rp ' : 'Rp ') + angka(Math.abs(v));
}

// 'YYYY-MM-DD HH:mm:ss' -> 'DD/MM/YYYY HH:mm'
export function tanggalWaktu(s) {
  if (!s) return '';
  const [d, t = ''] = String(s).split(' ');
  const [y, m, dd] = d.split('-');
  return `${dd}/${m}/${y} ${t.slice(0, 5)}`.trim();
}

// Waktu sekarang di zona WIB, format 'YYYY-MM-DD HH:mm:ss'
export function nowWib() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });
}

// Bulan berjalan di WIB, format 'YYYY-MM'
export function bulanIni() {
  return nowWib().slice(0, 7);
}

export function namaBulan(b) {
  const [y, m] = String(b).split('-');
  return `${BULAN[Number(m) - 1]} ${y}`;
}

// ['YYYY-MM-01 00:00:00', 'awal bulan berikutnya']
export function rangeBulan(b) {
  const [y, m] = String(b).split('-').map(Number);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return [`${b}-01 00:00:00`, `${ny}-${String(nm).padStart(2, '0')}-01 00:00:00`];
}
