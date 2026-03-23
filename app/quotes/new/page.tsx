import { requireUser } from '@/lib/auth';
import { QuoteForm } from '@/components/quote-form';

export default async function NewQuotePage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Step 1</p>
        <h1 className="text-3xl font-bold">Create a quote</h1>
        <p className="mt-2 text-slate-600">Fill in the client and service information. The backend will create the client if needed and store the quote as a draft for the authenticated freelancer.</p>
      </div>
      <QuoteForm />
    </main>
  );
}
