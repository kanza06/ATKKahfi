export default function manifest() {
  return {
    name: 'ATK Kahfi',
    short_name: 'ATK Kahfi',
    description: 'Kasir, stok barang, dan catatan kas toko',
    start_url: '/kasir',
    display: 'standalone',
    background_color: '#F6F7FB',
    theme_color: '#2A3EB1',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
