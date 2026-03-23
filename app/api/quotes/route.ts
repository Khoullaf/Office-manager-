import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseAdminClient } from '@/lib/supabase';
import { quoteFormSchema } from '@/lib/validations';
import { createQuoteEvent, ensureClientForUser, getNextQuoteNumber } from '@/lib/data';
import type { QuoteRecord } from '@/lib/types';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = quoteFormSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid quote payload.' }, { status: 400 });
  }

  try {
    const client = await ensureClientForUser({
      userId: user.id,
      name: parsed.data.clientName,
      email: parsed.data.clientEmail,
      companyName: parsed.data.companyName || null
    });

    const quoteNumber = await getNextQuoteNumber(user.id);
    const supabase = createSupabaseAdminClient();
    const [quote] = await supabase.insert<QuoteRecord>('quotes', {
      user_id: user.id,
      client_id: client.id,
      quote_number: quoteNumber,
      service_title: parsed.data.serviceTitle,
      description: parsed.data.description || null,
      amount_cents: Math.round(parsed.data.amount * 100),
      currency: parsed.data.currency,
      public_token: randomUUID(),
      status: 'draft'
    });

    await createQuoteEvent(quote.id, 'created', {
      serviceTitle: parsed.data.serviceTitle,
      amount: parsed.data.amount,
      currency: parsed.data.currency
    });

    return NextResponse.json({ quoteId: quote.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create quote.' }, { status: 500 });
  }
}
