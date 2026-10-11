'use client';
import { useState } from 'react';
import { api } from '@/lib/client';
import { NAMA_TOKO } from '@/lib/config';
import { Alert, Icon } from '@/components/ui';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function masuk(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await api('/api/auth/login', { method: 'POST', body: { username, password } });
      window.location.href = '/kasir';
    } catch (e2) {
      setErr(e2.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={masuk} className="card w-full max-w-sm p-7 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand text-white flex items-center justify-center">
            <Icon name="pencil" />
          </div>
          <div>
            <div className="text-xl font-extrabold tracking-tight">{NAMA_TOKO}</div>
            <div className="text-sm text-muted">Masuk untuk membuka kasir</div>
          </div>
        </div>
        <Alert>{err}</Alert>
        <div>
          <label htmlFor="username" className="label">Username</label>
          <input id="username" className="input" autoComplete="username" autoCapitalize="none"
            value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="input" autoComplete="current-password"
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full min-h-[52px] text-base">
          {loading ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}
