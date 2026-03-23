import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAccessCookieName } from '@/lib/auth';

const publicPaths = ['/login', '/signup', '/q'];
const publicApiPrefixes = ['/api/auth', '/api/public', '/api/cron'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/favicon.ico';
  if (isStaticAsset) return NextResponse.next();

  const isPublicPage = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isPublicApi = publicApiPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isPublicPage || isPublicApi) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(getAccessCookieName());
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
