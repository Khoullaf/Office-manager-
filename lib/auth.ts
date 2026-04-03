import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEnv } from './env';
import type { AuthSession, AuthUser } from './types';

const ACCESS_COOKIE = 'qf-access-token';
const REFRESH_COOKIE = 'qf-refresh-token';

async function authFetch(path: string, init?: RequestInit) {
  const env = getEnv();
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response;
}

export async function signUpWithPassword(email: string, password: string) {
  const response = await authFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  return (await response.json()) as AuthSession;
}

export async function signInWithPassword(email: string, password: string) {
  const response = await authFetch('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  return (await response.json()) as AuthSession;
}

export async function refreshSession(refreshToken: string) {
  const response = await authFetch('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken })
  });

  return (await response.json()) as AuthSession;
}

export async function fetchUserFromAccessToken(accessToken: string) {
  const response = await authFetch('/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return (await response.json()) as AuthUser;
}

export async function storeSession(session: AuthSession) {
  if (!session.access_token || !session.refresh_token || !session.expires_in) {
    return;
  }

  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: session.expires_in
  });

  cookieStore.set(REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return null;
  }

  try {
    if (accessToken) {
      return await fetchUserFromAccessToken(accessToken);
    }
  } catch {
    // Fallback to refresh below.
  }

  if (!refreshToken) {
    return null;
  }

  try {
    const session = await refreshSession(refreshToken);
    await storeSession(session);
    if (!session.access_token) {
      return null;
    }

    return await fetchUserFromAccessToken(session.access_token);
  } catch {
    await clearSession();
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return user;
}

export function getAccessCookieName() {
  return ACCESS_COOKIE;
}
