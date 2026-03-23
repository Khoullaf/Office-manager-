export type QuoteStatus = 'draft' | 'sent' | 'opened' | 'accepted' | 'refused';

export type QuoteEventType =
  | 'created'
  | 'sent'
  | 'opened'
  | 'accepted'
  | 'refused'
  | 'follow_up_sent';

export interface ProfileRecord {
  id: string;
  full_name: string | null;
  company_name: string | null;
  created_at: string;
}

export interface ClientRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  company_name: string | null;
  created_at: string;
}

export interface QuoteRecord {
  id: string;
  user_id: string;
  client_id: string;
  quote_number: string;
  service_title: string;
  description: string | null;
  amount_cents: number;
  currency: 'EUR' | 'USD' | 'GBP';
  status: QuoteStatus;
  sent_at: string | null;
  opened_at: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  last_follow_up_at: string | null;
  follow_up_count: number;
  public_token: string;
  created_at: string;
  updated_at: string;
  client?: ClientRecord;
}

export interface QuoteEventRecord {
  id: number;
  quote_id: string;
  event_type: QuoteEventType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user: AuthUser;
}
