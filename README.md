# QuoteFlow MVP

QuoteFlow is a simple SaaS MVP for freelancers who need to create quotes, generate a PDF, email it to a client, send automatic follow-ups, and track the final status.

## 1. Full project architecture

### Product scope
The MVP covers five core flows:
1. Create a quote with client name, email, service, amount, and optional notes.
2. Generate a PDF quote on demand.
3. Send the quote by email.
4. Trigger automatic follow-up reminders after 3 and 7 days if the quote is still pending.
5. Track the quote status as `sent`, `opened`, `accepted`, or `refused`.

### Directory structure

```text
app/
  api/
    auth/
      login/route.ts
      logout/route.ts
      signup/route.ts
    cron/follow-ups/route.ts
    public/quotes/[token]/status/route.ts
    quotes/
      [id]/pdf/route.ts
      [id]/send/route.ts
      route.ts
  login/page.tsx
  q/[token]/page.tsx
  quotes/[id]/page.tsx
  quotes/new/page.tsx
  signup/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  auth-form.tsx
  logout-button.tsx
  public-quote-actions.tsx
  quote-form.tsx
  send-quote-button.tsx
  status-badge.tsx
lib/
  auth.ts
  data.ts
  email.ts
  env.ts
  pdf.tsx
  supabase.ts
  types.ts
  utils.ts
  validations.ts
supabase/
  schema.sql
```

### What each part does

#### Frontend pages
- `app/page.tsx`: authenticated dashboard with quote list, architecture summary, schema summary, and implementation plan.
- `app/login/page.tsx`: login screen.
- `app/signup/page.tsx`: signup screen.
- `app/quotes/new/page.tsx`: quote creation form.
- `app/quotes/[id]/page.tsx`: quote detail page with PDF and send actions.
- `app/q/[token]/page.tsx`: public client review page.

#### Reusable UI components
- `components/auth-form.tsx`: shared login/signup form.
- `components/quote-form.tsx`: quote creation form.
- `components/send-quote-button.tsx`: email trigger button.
- `components/public-quote-actions.tsx`: accept/refuse controls for the public page.
- `components/status-badge.tsx`: quote status pill.
- `components/logout-button.tsx`: logout action.

#### Backend and business logic
- `app/api/auth/*`: signup/login/logout handlers.
- `app/api/quotes/route.ts`: create a quote and reuse or create the client.
- `app/api/quotes/[id]/pdf/route.ts`: generate a PDF for one quote.
- `app/api/quotes/[id]/send/route.ts`: send the quote email and mark it as sent.
- `app/api/public/quotes/[token]/status/route.ts`: update quote status from the public page.
- `app/api/cron/follow-ups/route.ts`: protected cron route for day-3 and day-7 reminders.

#### Shared server libraries
- `lib/env.ts`: environment validation.
- `lib/auth.ts`: Supabase auth helpers and session cookies.
- `lib/supabase.ts`: lightweight REST helpers for Supabase.
- `lib/data.ts`: data access and quote lifecycle helpers.
- `lib/email.ts`: Resend email integration.
- `lib/pdf.tsx`: lightweight PDF generator.
- `lib/validations.ts`: Zod validation schemas.
- `lib/types.ts`: application types.
- `lib/utils.ts`: formatting helpers.

#### Database
- `supabase/schema.sql`: tables, indexes, triggers, and RLS policies.

## 2. Database schema

### Tables

#### `profiles`
Stores freelancer profile data and links each row to `auth.users`.

Columns:
- `id`: UUID primary key, references `auth.users(id)`.
- `full_name`: optional freelancer name.
- `company_name`: optional freelancer company name.
- `created_at`: creation timestamp.

#### `clients`
Stores each freelancer's client contacts.

Columns:
- `id`: UUID primary key.
- `user_id`: owner freelancer.
- `name`: client name.
- `email`: client email.
- `company_name`: optional company.
- `created_at`: creation timestamp.

Constraint:
- unique `(user_id, email)` so each freelancer reuses the same client row.

#### `quotes`
Stores the quote itself and all lifecycle timestamps.

Columns:
- `id`: UUID primary key.
- `user_id`: owner freelancer.
- `client_id`: linked client.
- `quote_number`: user-facing quote reference.
- `service_title`: short service label.
- `description`: optional details.
- `amount_cents`: price in cents.
- `currency`: `EUR`, `USD`, or `GBP`.
- `status`: `draft | sent | opened | accepted | refused`.
- `sent_at`, `opened_at`, `accepted_at`, `refused_at`: lifecycle timestamps.
- `follow_up_count`: number of reminders sent.
- `last_follow_up_at`: last reminder timestamp.
- `public_token`: UUID used by the client-facing page.
- `created_at`, `updated_at`: timestamps.

Constraint:
- unique `(user_id, quote_number)` so quote numbers stay unique per freelancer.

#### `quote_events`
Stores immutable audit events.

Columns:
- `id`: identity primary key.
- `quote_id`: linked quote.
- `event_type`: `created`, `sent`, `opened`, `accepted`, `refused`, or `follow_up_sent`.
- `payload`: JSON payload.
- `created_at`: timestamp.

## 3. Step-by-step implementation plan

1. Create the Next.js App Router shell with Tailwind and strict TypeScript.
2. Add environment validation and shared utility helpers.
3. Implement Supabase auth helpers and cookie session storage.
4. Create the database schema in Supabase with RLS and indexes.
5. Build the dashboard, auth pages, quote form, quote detail page, and public quote page.
6. Implement the quote creation API and client deduplication logic.
7. Implement PDF generation.
8. Implement email sending with Resend.
9. Implement the public status update route.
10. Implement the protected cron route for follow-ups.
11. Run end-to-end validation with a real Supabase and Resend setup.

## 4. MVP code flow

### Auth flow
- Signup and login call Supabase Auth REST endpoints.
- Tokens are stored in HTTP-only cookies.
- `middleware.ts` protects private pages and private quote APIs.
- The dashboard and quote pages fetch the current authenticated user on the server.

### Quote creation flow
- The freelancer submits `components/quote-form.tsx`.
- `app/api/quotes/route.ts` validates the payload with Zod.
- The API finds or creates the client for the authenticated freelancer.
- The API creates a `draft` quote with a `public_token`.
- The API logs a `created` event.

### Quote sending flow
- The freelancer clicks “Send by email”.
- `app/api/quotes/[id]/send/route.ts` loads the quote, generates the PDF, sends the email with Resend, marks the quote as `sent`, and logs a `sent` event.

### Public review flow
- The client opens `/q/[token]`.
- If the quote was `sent`, opening the page marks it as `opened` and logs an event.
- The client can accept or refuse the quote from the public page.

### Follow-up flow
- A scheduler calls `POST /api/cron/follow-ups` once per day.
- If `follow_up_count = 0` and `sent_at <= now() - 3 days`, the app sends reminder #1.
- If `follow_up_count = 1` and `sent_at <= now() - 7 days`, the app sends reminder #2.
- Each reminder logs a `follow_up_sent` event.

## 5. Environment variables

Create `.env.local` from `.env.example`.

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `APP_BASE_URL`
- `CRON_SECRET`
- `CRON_ALLOWED_IPS` (optional, comma-separated IP allowlist for cron caller)
- `EMAIL_FROM`

## 6. Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 7. Validation checklist

### App validation
1. Sign up a freelancer account.
2. Log in.
3. Create a quote.
4. Open the quote detail page.
5. Download the PDF.
6. Send the quote email.
7. Open the public URL from the email.
8. Accept or refuse the quote.
9. Call the cron endpoint with `CRON_SECRET`.

### Build validation
Run these commands in order:

```bash
npm run typecheck
npm run lint
npm run build
```

## 8. Notes

- `opened` means the client opened the public quote page, not the email itself.
- Stripe is intentionally out of scope for this first MVP.
- For a later production version, add password reset, richer PDF branding, and automated tests.
