import { buildQuoteNumber } from './utils';
import { createSupabaseAdminClient, eq } from './supabase';
import type { ClientRecord, QuoteRecord, QuoteStatus } from './types';

const quoteSelect = '*,client:clients(*)';

export async function ensureClientForUser(input: {
  userId: string;
  name: string;
  email: string;
  companyName?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const existing = await supabase.maybeSingle<ClientRecord>('clients', {
    filters: [eq('user_id', input.userId), eq('email', input.email)]
  });

  if (existing) {
    const [updated] = await supabase.update<ClientRecord>(
      'clients',
      {
        name: input.name,
        company_name: input.companyName ?? null
      },
      [eq('id', existing.id), eq('user_id', input.userId)]
    );

    return updated;
  }

  const [created] = await supabase.insert<ClientRecord>('clients', {
    user_id: input.userId,
    name: input.name,
    email: input.email,
    company_name: input.companyName ?? null
  });

  return created;
}

export async function getNextQuoteNumber(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { count } = await supabase.select<Pick<QuoteRecord, 'id'>>('quotes', {
    select: 'id',
    filters: [eq('user_id', userId)],
    count: 'exact'
  });

  return buildQuoteNumber((count ?? 0) + 1);
}

export async function getQuotesByUser(userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.select<QuoteRecord>('quotes', {
    select: quoteSelect,
    order: { column: 'created_at', ascending: false },
    filters: [eq('user_id', userId)]
  });

  return data ?? [];
}

export async function getQuoteById(id: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.single<QuoteRecord>('quotes', {
    select: quoteSelect,
    filters: [eq('id', id), eq('user_id', userId)]
  });
}

export async function getQuoteByToken(token: string) {
  const supabase = createSupabaseAdminClient();
  return supabase.single<QuoteRecord>('quotes', {
    select: quoteSelect,
    filters: [eq('public_token', token)]
  });
}

export async function createQuoteEvent(quoteId: string, eventType: string, payload: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  await supabase.insert('quote_events', {
    quote_id: quoteId,
    event_type: eventType,
    payload
  });
}

export async function updateQuoteStatusByToken(token: string, status: QuoteStatus) {
  const now = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const statusPayload =
    status === 'accepted'
      ? { status, accepted_at: now }
      : { status, refused_at: now };

  const [quote] = await supabase.update<QuoteRecord>('quotes', statusPayload, [eq('public_token', token)]);
  return { quote, now };
}

export async function markQuoteAsOpened(token: string) {
  const supabase = createSupabaseAdminClient();
  const [quote] = await supabase.update<QuoteRecord>(
    'quotes',
    {
      status: 'opened',
      opened_at: new Date().toISOString()
    },
    [eq('public_token', token), eq('status', 'sent')]
  );

  return quote ?? null;
}
