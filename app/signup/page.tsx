import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md space-y-6 pt-12">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">Authentication</p>
        <h1 className="mt-2 text-3xl font-bold">Create your account</h1>
        <p className="mt-3 text-slate-600">This creates a real Supabase user and starts an authenticated session.</p>
      </div>
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-slate-600">
        Already registered? <Link href="/login">Login</Link>
      </p>
    </main>
  );
}
