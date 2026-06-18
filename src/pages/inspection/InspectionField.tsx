export const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="font-display text-sm font-500 uppercase tracking-wide text-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-accent">*</span>}
    </label>
    {children}
  </div>
);
