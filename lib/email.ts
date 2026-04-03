import { Resend } from 'resend';
import { getEnv } from './env';
import type { QuoteRecord } from './types';
import { formatCurrency } from './utils';

let cachedResend: Resend | null = null;

function getResendClient() {
  if (cachedResend) {
    return cachedResend;
  }

  cachedResend = new Resend(getEnv().RESEND_API_KEY);
  return cachedResend;
}

type QuoteWithClient = QuoteRecord & {
  client: {
    name: string;
    email: string;
    company_name?: string | null;
  };
};

function quoteLink(token: string) {
  return `${getEnv().APP_BASE_URL}/q/${token}`;
}

export async function sendQuoteEmail(quote: QuoteWithClient, pdfBuffer?: Buffer) {
  const resend = getResendClient();

  return resend.emails.send({
    from: getEnv().EMAIL_FROM,
    to: quote.client.email,
    subject: `Quote ${quote.quote_number} for ${quote.service_title}`,
    html: `
      <p>Hello ${quote.client.name},</p>
      <p>Please find your quote for <strong>${quote.service_title}</strong>.</p>
      <p>Amount: <strong>${formatCurrency(quote.amount_cents, quote.currency)}</strong></p>
      <p>Review and respond here: <a href="${quoteLink(quote.public_token)}">${quoteLink(quote.public_token)}</a></p>
      <p>Thank you.</p>
    `,
    attachments: pdfBuffer
      ? [
          {
            filename: `${quote.quote_number}.pdf`,
            content: pdfBuffer
          }
        ]
      : undefined
  });
}

export async function sendFollowUpEmail(quote: QuoteWithClient, followUpNumber: number) {
  const resend = getResendClient();

  return resend.emails.send({
    from: getEnv().EMAIL_FROM,
    to: quote.client.email,
    subject: `Reminder ${followUpNumber}: ${quote.quote_number}`,
    html: `
      <p>Hello ${quote.client.name},</p>
      <p>This is a quick reminder about your quote for <strong>${quote.service_title}</strong>.</p>
      <p>You can review it here: <a href="${quoteLink(quote.public_token)}">${quoteLink(quote.public_token)}</a></p>
    `
  });
}
