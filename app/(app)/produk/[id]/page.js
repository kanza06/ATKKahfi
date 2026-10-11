'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminOnly } from '@/components/Shell';
import ProdukForm from '@/components/ProdukForm';
import { Alert, PageHeader } from '@/components/ui';
import { api } from '@/lib/client';

function Isi() {
  const { id } = useParams();
  const [produk, setProduk] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api(`/api/produk/${id}`).then((d) => setProduk(d.produk)).catch((e) => setErr(e.message));
  }, [id]);

  return (
    <>
      <PageHeader title="Edit barang" subtitle="Ubah foto, nama, harga, atau stok." />
      <Alert>{err}</Alert>
      {produk && <ProdukForm produk={produk} />}
    </>
  );
}

export default function EditProdukPage() {
  return <AdminOnly><Isi /></AdminOnly>;
}
