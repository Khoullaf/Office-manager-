import { NextResponse } from 'next/server';
import { authSchema } from '@/lib/validations';
import { signUpWithPassword, storeSession } from '@/lib/auth';
import { createSupabaseAdminClient, eq } from '@/lib/supabase';
import type { ProfileRecord } from '@/lib/types';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = authSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid signup payload.' }, { status: 400 });
  }

  try {
    const session = await signUpWithPassword(parsed.data.email, parsed.data.password);
    await storeSession(session);

    if (session.user?.id) {
      const supabase = createSupabaseAdminClient();
      const existingProfile = await supabase.maybeSingle<ProfileRecord>('profiles', {
        filters: [eq('id', session.user.id)]
      });

      if (!existingProfile) {
        await supabase.insert('profiles', {
          id: session.user.id,
          full_name: null,
          company_name: null
        });
      }
    }

    return NextResponse.json({ success: true, requiresEmailConfirmation: !session.access_token });
  } catch {
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}
