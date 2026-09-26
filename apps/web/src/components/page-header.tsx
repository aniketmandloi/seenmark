import type { ReactNode } from "react";

export default function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow ? <p className="font-medium text-primary text-sm">{eyebrow}</p> : null}
        <h1 className="font-display text-title">{title}</h1>
        {lede ? <p className="text-lede text-muted-foreground">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
