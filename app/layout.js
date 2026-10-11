import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { NAMA_TOKO } from '@/lib/config';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export const metadata = {
  title: `${NAMA_TOKO} - Kasir & Stok`,
  description: 'Kasir, stok barang, dan catatan kas toko',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2A3EB1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
