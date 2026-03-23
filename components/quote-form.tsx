'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

const initialState = {
  clientName: '',
  clientEmail: '',
  companyName: '',
  serviceTitle: '',
  description: '',
  amount: '',
  currency: 'EUR'
};

export function QuoteForm() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const payload = (await response.json()) as { quoteId?: string; error?: string };
    setLoading(false);

    if (!response.ok || !payload.quoteId) {
      setError(payload.error ?? 'Unable to create the quote.');
      return;
    }

    router.push(`/quotes/${payload.quoteId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Client name</span>
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Client email</span>
          <input type="email" className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Company</span>
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Service</span>
          <input className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.serviceTitle} onChange={(event) => setForm({ ...form, serviceTitle: event.target.value })} required />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium">Description</span>
          <textarea className="min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Price</span>
          <input type="number" min="1" step="0.01" className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Currency</span>
          <select className="w-full rounded-xl border border-slate-300 px-4 py-3" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button disabled={loading} className="rounded-xl bg-brand px-5 py-3 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
        {loading ? 'Creating...' : 'Create quote'}
      </button>
    </form>
  );
}
