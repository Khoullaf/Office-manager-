import { NextResponse } from 'next/server';
import { createQuoteEvent, updateQuoteStatusByToken } from '@/lib/data';
import { publicQuoteStatusSchema } from '@/lib/validations';

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json();
  const parsed = publicQuoteStatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  try {
    const { quote, now } = await updateQuoteStatusByToken(token, parsed.data.status);

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found.' }, { status: 404 });
    }

    await createQuoteEvent(quote.id, parsed.data.status, { updatedAt: now, source: 'public_quote_page' });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to update quote.' }, { status: 500 });
  }
}
