import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getQuoteById } from '@/lib/data';
import { SendQuoteButton } from '@/components/send-quote-button';
import { StatusBadge } from '@/components/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const quote = await getQuoteById(id, user.id).catch(() => null);

  if (!quote) {
    notFound();
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Quote detail</p>
            <h1 className="mt-2 text-3xl font-bold">{quote.quote_number}</h1>
            <p className="mt-2 text-slate-600">{quote.service_title}</p>
          </div>
          <StatusBadge status={quote.status} />
        </div>

        <dl className="grid gap-6 md:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Client</dt>
            <dd className="mt-1 font-medium text-slate-900">{quote.client?.name}</dd>
            <dd className="text-slate-600">{quote.client?.email}</dd>
            {quote.client?.company_name ? <dd className="text-slate-600">{quote.client.company_name}</dd> : null}
          </div>
          <div>
            <dt className="text-sm text-slate-500">Amount</dt>
            <dd className="mt-1 font-medium text-slate-900">{formatCurrency(quote.amount_cents, quote.currency)}</dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-slate-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-700">{quote.description || 'No description provided.'}</dd>
          </div>
        </dl>
      </section>

      <aside className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold">Actions</h2>
          <div className="space-y-4">
            <SendQuoteButton quoteId={quote.id} />
            <Link
              href={`/api/quotes/${quote.id}/pdf`}
              className="block rounded-xl border border-slate-300 px-4 py-3 text-center font-semibold text-slate-900"
            >
              Download PDF
            </Link>
            <Link href={`/q/${quote.public_token}`} className="block text-sm text-slate-600 underline underline-offset-4">
              Open the public client page
            </Link>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-8 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Lifecycle</h2>
          <ul className="space-y-3">
            <li>Created: {formatDateTime(quote.created_at)}</li>
            <li>Sent: {formatDateTime(quote.sent_at)}</li>
            <li>Opened: {formatDateTime(quote.opened_at)}</li>
            <li>Accepted: {formatDateTime(quote.accepted_at)}</li>
            <li>Refused: {formatDateTime(quote.refused_at)}</li>
            <li>Last follow-up: {formatDateTime(quote.last_follow_up_at)}</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
