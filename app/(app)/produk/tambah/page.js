'use client';
import { AdminOnly } from '@/components/Shell';
import ProdukForm from '@/components/ProdukForm';
import { PageHeader } from '@/components/ui';

export default function TambahProdukPage() {
  return (
    <AdminOnly>
      <PageHeader title="Tambah barang" subtitle="Ambil foto barang dengan kamera, lalu isi datanya." />
      <ProdukForm />
    </AdminOnly>
  );
}
