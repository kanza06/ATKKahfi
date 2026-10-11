import { query } from '@/lib/db';
import { wrap } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = wrap(async (req, { params }) => {
  const [r] = await query('SELECT mime, data FROM product_images WHERE product_id = ?', [Number(params.id)]);
  if (!r) return new Response('Tidak ada gambar', { status: 404 });
  return new Response(r.data, {
    headers: {
      'Content-Type': r.mime,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  });
});
