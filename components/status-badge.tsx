import { cn } from '@/lib/utils';
import type { QuoteStatus } from '@/lib/types';

const statusClasses: Record<QuoteStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  opened: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  refused: 'bg-rose-100 text-rose-700'
};

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return <span className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize', statusClasses[status])}>{status}</span>;
}
