import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createQuoteEvent, getQuoteById } from '@/lib/data';
import { sendQuoteEmail } from '@/lib/email';
import { generateQuotePdfBuffer } from '@/lib/pdf';
import { createSupabaseAdminClient, eq } from '@/lib/supabase';
import type { QuoteRecord } from '@/lib/types';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { id } = await params;
  const quote = await getQuoteById(id, user.id).catch(() => null);

  if (!quote || !quote.client) {
    return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
  }

  const quoteWithClient = quote as typeof quote & { client: NonNullable<typeof quote.client> };

  try {
    const pdfBuffer = await generateQuotePdfBuffer(quoteWithClient);
    await sendQuoteEmail(quoteWithClient, pdfBuffer);

    const sentAt = new Date().toISOString();
    const supabase = createSupabaseAdminClient();
    await supabase.update<QuoteRecord>(
      'quotes',
      {
        status: 'sent',
        sent_at: sentAt
      },
      [eq('id', id), eq('user_id', user.id)]
    );

    await createQuoteEvent(id, 'sent', { sentAt });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to send quote.' }, { status: 500 });
  }
}
