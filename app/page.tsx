import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getQuotesByUser } from '@/lib/data';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';

const architectureBlocks = [
  {
    title: 'Frontend',
    description: 'Next.js App Router pages for auth, dashboard, quote creation, quote detail, and public client review.'
  },
  {
    title: 'Backend',
    description: 'API routes for auth, quote creation, PDF generation, email sending, public responses, and follow-up cron.'
  },
  {
    title: 'Data',
    description: 'Supabase Postgres tables for profiles, clients, quotes, and quote_events with RLS and indexes.'
  }
];

const implementationSteps = [
  'Authenticate freelancers with Supabase email/password auth.',
  'Create and reuse clients per freelancer.',
  'Store quotes with a public token and lifecycle timestamps.',
  'Generate a PDF and send the quote by email.',
  'Trigger reminders after day 3 and day 7 if the quote is still pending.'
];

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) {
    return null;
  }

  const quotes = await getQuotesByUser(user.id).catch(() => []);

  return (
    <main className="space-y-8">
      <section className="rounded-3xl bg-slate-950 px-8 py-10 text-white shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">QuoteFlow MVP</p>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Create quotes, send them fast, and follow up automatically.</h1>
            <p className="text-slate-300">
              This MVP stays intentionally simple: one authenticated dashboard, one public quote page, one cron route for reminders,
              and a Supabase-backed data model that is ready for a small SaaS launch.
            </p>
          </div>
          <Link href="/quotes/new" className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-slate-100">
            Create a quote
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {architectureBlocks.map((block) => (
          <article key={block.title} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold">{block.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{block.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr,0.65fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Quotes</h2>
              <p className="text-sm text-slate-500">Track sent, opened, accepted, and refused quotes.</p>
            </div>
            <span className="text-sm text-slate-500">{quotes.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Quote</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-t border-slate-100">
                    <td className="py-4">
                      <Link href={`/quotes/${quote.id}`} className="font-medium text-slate-900">
                        {quote.quote_number}
                      </Link>
                      <p className="text-slate-500">{quote.service_title}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-medium text-slate-900">{quote.client?.name}</p>
                      <p className="text-slate-500">{quote.client?.email}</p>
                    </td>
                    <td className="py-4">{formatCurrency(quote.amount_cents, quote.currency)}</td>
                    <td className="py-4">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="py-4 text-slate-500">{formatDateTime(quote.updated_at)}</td>
                  </tr>
                ))}
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No quotes yet. Create your first quote to start the workflow.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold">Database schema</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <strong>profiles</strong>: freelancer metadata linked to Supabase Auth.
              </li>
              <li>
                <strong>clients</strong>: one row per customer contact, scoped by <code>user_id</code>.
              </li>
              <li>
                <strong>quotes</strong>: pricing, status, public token, sent/opened/accepted/refused timestamps, and follow-up counters.
              </li>
              <li>
                <strong>quote_events</strong>: immutable audit history for every lifecycle change.
              </li>
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-4 text-xl font-semibold">Implementation plan</h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-600">
              {implementationSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </aside>
      </section>
    </main>
  );
}
