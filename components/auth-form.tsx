'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const payload = (await response.json()) as { error?: string; requiresEmailConfirmation?: boolean };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? 'Authentication failed.');
      return;
    }

    if (mode === 'signup' && payload.requiresEmailConfirmation) {
      router.push('/login?message=confirm-email');
      router.refresh();
      return;
    }

    if (mode === 'signup') {
      setMessage('Account created. Redirecting to your dashboard.');
    }

    router.push(searchParams.get('next') ?? '/');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <label className="block space-y-2">
        <span className="text-sm font-medium">Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" required />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">Password</span>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3" required minLength={8} />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
      <button disabled={loading} className="w-full rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
      </button>
    </form>
  );
}
