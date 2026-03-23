import { NextResponse } from 'next/server';
import { createQuoteEvent } from '@/lib/data';
import { sendFollowUpEmail } from '@/lib/email';
import { getEnv } from '@/lib/env';
import { createSupabaseAdminClient, eq, inList, rawFilter } from '@/lib/supabase';
import type { QuoteRecord } from '@/lib/types';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${getEnv().CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: quotes } = await supabase.select<QuoteRecord>('quotes', {
      select: '*,client:clients(*)',
      filters: [
        inList('status', ['sent', 'opened']),
        rawFilter(`or=(and(follow_up_count.eq.0,sent_at.lte.${threeDaysAgo}),and(follow_up_count.eq.1,sent_at.lte.${sevenDaysAgo}))`)
      ]
    });

    let processed = 0;

    for (const quote of quotes ?? []) {
      if (!quote.client) {
        continue;
      }

      const followUpNumber = quote.follow_up_count + 1;
      await sendFollowUpEmail(quote as QuoteRecord & { client: NonNullable<QuoteRecord['client']> }, followUpNumber);
      await supabase.update<QuoteRecord>(
        'quotes',
        {
          follow_up_count: followUpNumber,
          last_follow_up_at: now.toISOString()
        },
        [eq('id', quote.id)]
      );
      await createQuoteEvent(quote.id, 'follow_up_sent', { followUpNumber });
      processed += 1;
    }

    return NextResponse.json({ success: true, processed });
  } catch {
    return NextResponse.json({ error: 'Unable to process follow-ups.' }, { status: 500 });
  }
}
