'use client';

import { useState } from 'react';

export function SendQuoteButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    const response = await fetch(`/api/quotes/${quoteId}/send`, { method: 'POST' });
    const payload = (await response.json()) as { success?: boolean; error?: string };
    setLoading(false);

    if (!payload.success) {
      setMessage(payload.error ?? 'Unable to send quote.');
      return;
    }

    setMessage('Quote emailed successfully.');
  }

  return (
    <div className="space-y-2">
      <button onClick={handleClick} disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60">
        {loading ? 'Sending...' : 'Send by email'}
      </button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
