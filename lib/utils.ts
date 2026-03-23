import { clsx } from 'clsx';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amountCents / 100);
}

export function buildQuoteNumber(index: number, date = new Date()) {
  const year = date.getFullYear();
  return `Q-${year}-${String(index).padStart(4, '0')}`;
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
