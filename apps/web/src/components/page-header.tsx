import type { ReactNode, RefObject } from "react";

export default function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  titleRef,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  /** Makes the title a place focus can be sent when the control that had it disappears. */
  titleRef?: RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl flex-col gap-3">
        {eyebrow ? <p className="font-medium text-primary text-sm">{eyebrow}</p> : null}
        <h1
          ref={titleRef}
          tabIndex={titleRef ? -1 : undefined}
          className="font-display text-title outline-none"
        >
          {title}
        </h1>
        {lede ? <p className="text-lede text-muted-foreground">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}
