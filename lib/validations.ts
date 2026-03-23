import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export const quoteFormSchema = z.object({
  clientName: z.string().trim().min(2),
  clientEmail: z.string().trim().email(),
  companyName: z.string().trim().max(120).optional().or(z.literal('')),
  serviceTitle: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  amount: z.coerce.number().positive(),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR')
});

export const publicQuoteStatusSchema = z.object({
  status: z.enum(['accepted', 'refused'])
});
