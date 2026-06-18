import { BuildObject } from '@/lib/api';

export const today = new Date();
export const toISO = (d: Date) => d.toISOString().split('T')[0];
export const tomorrow = toISO(new Date(today.getTime() + 86400000));
export const twoMonths = (() => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + 2);
  return toISO(d);
})();

export const dateInputClass =
  'w-full h-11 px-3 rounded-sm border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition';

export const objectLabel = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') +
  (o.address ? ` — ${o.address}` : ` (объект #${o.id})`);
