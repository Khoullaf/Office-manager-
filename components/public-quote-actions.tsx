'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PublicQuoteActions({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function update(status: 'accepted' | 'refused') {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/public/quotes/${token}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    const payload = (await response.json()) as { success?: boolean; error?: string };
    setLoading(false);

    if (!payload.success) {
      setMessage(payload.error ?? 'Unable to update quote.');
      return;
    }

    setMessage(status === 'accepted' ? 'Quote accepted. Thank you.' : 'Quote refused. Thank you for your feedback.');
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button onClick={() => update('accepted')} disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          Accept quote
        </button>
        <button onClick={() => update('refused')} disabled={loading} className="rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-60">
          Refuse quote
        </button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
