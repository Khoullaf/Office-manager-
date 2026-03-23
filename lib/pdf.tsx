import type { QuoteRecord } from './types';
import { formatCurrency } from './utils';

type QuoteWithClient = QuoteRecord & {
  client: {
    name: string;
    email: string;
    company_name?: string | null;
  };
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export async function generateQuotePdfBuffer(quote: QuoteWithClient) {
  const lines = [
    'QuoteFlow',
    `Quote: ${quote.quote_number}`,
    `Status: ${quote.status}`,
    '',
    `Client: ${quote.client.name}`,
    `Email: ${quote.client.email}`,
    quote.client.company_name ? `Company: ${quote.client.company_name}` : '',
    '',
    `Service: ${quote.service_title}`,
    quote.description ? `Details: ${quote.description}` : '',
    '',
    `Amount: ${formatCurrency(quote.amount_cents, quote.currency)}`
  ].filter(Boolean);

  const textCommands = lines
    .map((line, index) => `BT /F1 12 Tf 50 ${780 - index * 22} Td (${escapePdfText(line)}) Tj ET`)
    .join('\n');

  const contentStream = `${textCommands}\n`;
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}endstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj'
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf-8');
}
