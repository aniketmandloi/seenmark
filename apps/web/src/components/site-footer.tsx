import type { Route } from "next";
import Link from "next/link";

import Logo from "./logo";

const groups: { title: string; links: { href: Route; label: string }[] }[] = [
  {
    title: "Seenmark",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#privacy", label: "Privacy" },
      { href: "/#questions", label: "Questions" },
    ],
  },
  {
    title: "Your record",
    links: [
      { href: "/dashboard", label: "Check-ins" },
      { href: "/dashboard/next-steps", label: "Next steps" },
      { href: "/account", label: "Account" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-16 pb-12 sm:px-8 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-6">
          <Logo />
          <p className="mt-4 max-w-[34ch] text-[15px] text-muted-foreground leading-relaxed">
            A private record of your hairline check-ins and the next step you choose.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-8 lg:col-span-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="font-semibold text-sm">{group.title}</p>
              <ul className="mt-4 space-y-3 text-[15px] text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <p className="text-muted-foreground text-sm lg:col-span-12">
          Seenmark does not diagnose or interpret photos. For adults in the United States.
        </p>
      </div>
    </footer>
  );
}
