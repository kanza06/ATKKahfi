export function mapProduk(p, admin = true) {
  const { has_image, image_v, ...rest } = p;
  const out = { ...rest, gambar: has_image ? `/api/produk/${p.id}/gambar?v=${image_v}` : null };
  if (!admin) delete out.harga_beli;
  return out;
}

export function parseBarcode(v) {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, 64) : null;
}
