import Icon from '@/components/ui/icon';
import { BuildObject } from '@/lib/api';

export const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
    {children}
  </label>
);

export const dateInputClass =
  'w-full h-10 px-3 rounded-sm border border-input bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition';

export const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <section className="bg-card border border-border rounded-sm p-5 animate-fade-up">
    <h2 className="font-display text-base font-600 uppercase tracking-wide mb-4 flex items-center gap-2">
      <Icon name={icon} size={18} className="text-accent" />
      {title}
    </h2>
    {children}
  </section>
);

export const fullName = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') || `Объект #${o.id}`;
