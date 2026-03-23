import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getQuoteById } from '@/lib/data';
import { generateQuotePdfBuffer } from '@/lib/pdf';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const buffer = await generateQuotePdfBuffer(quoteWithClient);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${quote.quote_number}.pdf"`
    }
  });
}
