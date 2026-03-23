import { notFound } from 'next/navigation';
import { PublicQuoteActions } from '@/components/public-quote-actions';
import { createQuoteEvent, getQuoteByToken, markQuoteAsOpened } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';

async function recordOpen(token: string, currentStatus: string) {
  if (currentStatus !== 'sent') {
    return;
  }

  const quote = await markQuoteAsOpened(token);
  if (quote) {
    await createQuoteEvent(quote.id, 'opened', { source: 'public_quote_page' });
  }
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const quote = await getQuoteByToken(token).catch(() => null);

  if (!quote) {
    notFound();
  }

  await recordOpen(token, quote.status);

  return (
    <main className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Client review</p>
      <h1 className="mt-2 text-3xl font-bold">{quote.quote_number}</h1>
      <p className="mt-4 text-lg text-slate-800">{quote.service_title}</p>
      {quote.description ? <p className="mt-3 whitespace-pre-wrap text-slate-600">{quote.description}</p> : null}

      <div className="mt-8 rounded-2xl bg-slate-50 p-6">
        <p className="text-sm text-slate-500">Amount</p>
        <p className="mt-1 text-3xl font-bold">{formatCurrency(quote.amount_cents, quote.currency)}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Respond to this quote</h2>
        <p className="mt-2 text-sm text-slate-600">Use the buttons below to accept or refuse the quote. Opening this page marks it as opened.</p>
        <div className="mt-6">
          <PublicQuoteActions token={token} />
        </div>
      </div>
    </main>
  );
}
