import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Authentication</p>
        <h1 className="mt-2 text-3xl font-bold">Login to QuoteFlow</h1>
        <p className="mt-3 text-slate-600">Use your Supabase email/password account to access your quotes.</p>
      </div>
      <AuthForm mode="login" />
      <p className="text-center text-sm text-slate-600">
        No account yet? <Link href="/signup">Create one</Link>
      </p>
    </main>
  );
}
