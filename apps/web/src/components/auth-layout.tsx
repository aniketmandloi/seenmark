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
      <div className="flex flex-col justify-between gap-10 rounded-2xl bg-primary p-7 text-primary-foreground sm:p-10 lg:p-12 [&_p]:text-primary-foreground/75">
        <PageHeader
          title="Your hairline, on your terms."
          lede="Keep the photos you take, look back when you choose, and decide what feels right for you."
        />

        <ul className="grid gap-4 font-medium text-[15px] leading-6">
          {promises.map((promise) => (
            <li key={promise} className="flex gap-3">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-foreground text-primary">
                <Check aria-hidden="true" className="size-3" strokeWidth={3} />
              </span>
              {promise}
            </li>
          ))}
        </ul>
      </div>

      <div className="animate-rise rounded-2xl border border-border bg-card p-6 shadow-paper sm:p-10 lg:p-12">
        {children}
      </div>
    </section>
  );
}
