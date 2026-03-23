create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  company_name text,
  created_at timestamptz not null default now(),
  unique(user_id, email)
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  quote_number text not null,
  service_title text not null,
  description text,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP')),
  status text not null default 'draft' check (status in ('draft', 'sent', 'opened', 'accepted', 'refused')),
  sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz,
  refused_at timestamptz,
  follow_up_count integer not null default 0 check (follow_up_count between 0 and 2),
  last_follow_up_at timestamptz,
  public_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, quote_number)
);

create table if not exists public.quote_events (
  id bigint generated always as identity primary key,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  event_type text not null check (event_type in ('created', 'sent', 'opened', 'accepted', 'refused', 'follow_up_sent')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_clients_user_id on public.clients(user_id);
create index if not exists idx_quotes_user_id on public.quotes(user_id);
create index if not exists idx_quotes_status_sent_at on public.quotes(status, sent_at);
create index if not exists idx_quote_events_quote_id on public.quote_events(quote_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_quotes_updated_at on public.quotes;
create trigger trg_quotes_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

drop policy if exists "clients_manage_own" on public.clients;
create policy "clients_manage_own" on public.clients
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quotes_manage_own" on public.quotes;
create policy "quotes_manage_own" on public.quotes
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "quote_events_read_own" on public.quote_events;
create policy "quote_events_read_own" on public.quote_events
for select using (
  exists (
    select 1
    from public.quotes q
    where q.id = quote_id
      and q.user_id = auth.uid()
  )
);
