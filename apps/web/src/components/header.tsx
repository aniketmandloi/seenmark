"use client";

import { buttonVariants } from "@seenmark/ui/components/button";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { activeHref } from "@/lib/active-link";
import { authClient } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";
import UserMenu, { accountHref } from "./user-menu";

const visitorLinks: { href: Route; label: string }[] = [
  { href: "/#how-it-works", label: "How it works" },
];

const memberLinks: { href: Route; label: string }[] = [
  { href: "/dashboard", label: "Check-ins" },
  { href: "/dashboard/next-steps", label: "Next steps" },
  { href: accountHref, label: "Account" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  const links = isPending ? [] : session ? memberLinks : visitorLinks;
  const current = activeHref(
    pathname,
    links.map((link) => link.href),
  );

  return (
    <header className="sticky top-0 z-50 border-border/80 border-b bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Seenmark home"
          className="shrink-0 font-display text-3xl text-foreground"
        >
          seenmark<span className="text-primary">.</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const isCurrent = link.href === current;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`rounded-md text-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ModeToggle />
          <UserMenu />
          {!isPending && !session ? (
            <Link href="/login" className={buttonVariants({ className: "hidden sm:inline-flex" })}>
              Get started
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
