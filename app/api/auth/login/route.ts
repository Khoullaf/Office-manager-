import { NextResponse } from 'next/server';
import { authSchema } from '@/lib/validations';
import { signInWithPassword, storeSession } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = authSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid login payload.' }, { status: 400 });
  }

  try {
    const session = await signInWithPassword(parsed.data.email, parsed.data.password);
    await storeSession(session);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }
}
