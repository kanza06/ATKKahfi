// Helper fetch untuk komponen client
export async function api(url, options = {}) {
  const { body, headers, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {}
  if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login';
    throw new Error('Sesi berakhir, silakan login lagi');
  }
  if (!res.ok) throw new Error(data?.error || 'Terjadi kesalahan');
  return data;
}

// Kecilkan foto (maks 800 px) dan ubah ke JPEG agar hemat ruang
export function resizeImage(file, max = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const skala = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * skala);
      const h = Math.round(img.height * skala);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}
