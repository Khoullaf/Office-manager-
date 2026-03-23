import './globals.css';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export const metadata = {
  title: 'QuoteFlow MVP',
  description: 'Simple quote management for freelancers.'
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900">
        <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
          <header className="mb-10 flex flex-col gap-4 rounded-3xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <Link href="/" className="text-2xl font-bold text-slate-900">
                QuoteFlow
              </Link>
              <p className="text-sm text-slate-500">Quotes, PDF delivery, follow-ups, and status tracking for freelancers.</p>
            </div>
            <nav className="flex items-center gap-4 text-sm font-medium">
              {user ? (
                <>
                  <Link href="/">Dashboard</Link>
                  <Link href="/quotes/new">New quote</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login">Login</Link>
                  <Link href="/signup">Signup</Link>
                </>
              )}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
