import type { ReactNode, Ref } from "react";

/**
 * A section whose heading sits in the page's left margin from lg up, like a label written beside
 * a notebook entry. Below lg the heading stacks above its content.
 */
export default function MarginSection({
  id,
  heading,
  headingRef,
  children,
  className = "",
}: {
  id: string;
  heading: ReactNode;
  /** Makes the heading a place focus can be sent when the control that had it disappears. */
  headingRef?: Ref<HTMLHeadingElement>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-x-10 ${className}`}
    >
      <h2
        ref={headingRef}
        id={id}
        tabIndex={headingRef ? -1 : undefined}
        className="font-semibold text-base leading-6 outline-none lg:border-border lg:border-r lg:pt-1 lg:pr-6"
      >
        {heading}
      </h2>
      <div className="mt-4 min-w-0 lg:mt-0">{children}</div>
    </section>
  );
}
