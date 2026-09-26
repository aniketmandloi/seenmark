import { Check } from "lucide-react";
import type { ReactNode } from "react";

import PageHeader from "./page-header";

const promises = [
  "Your check-ins are visible only to you.",
  "You choose early, mid, or late for yourself.",
  "A photo never decides what comes next.",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
      <div className="flex flex-col justify-between gap-10 rounded-4xl bg-accent/45 p-7 sm:p-10 lg:p-12">
        <PageHeader
          title="Your hairline, on your terms."
          lede="Keep the photos you take, look back when you choose, and decide what feels right for you."
        />

        <ul className="grid gap-4 text-foreground text-sm leading-6">
          {promises.map((promise) => (
            <li key={promise} className="flex gap-3">
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              {promise}
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-rise rounded-4xl border border-border/80 bg-card p-6 shadow-soft sm:p-10 lg:p-12">
        {children}
      </div>
    </section>
  );
}
