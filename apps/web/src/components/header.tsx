"use client";

import { Button, buttonVariants } from "@seenmark/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@seenmark/ui/components/dialog";
import { cn } from "@seenmark/ui/lib/utils";
import { MenuIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type CSSProperties, useState } from "react";

import { activeHref } from "@/lib/active-link";
import { authClient } from "@/lib/auth-client";

import Logo from "./logo";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const visitorLinks: { href: Route; label: string }[] = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#questions", label: "Questions" },
];

const memberLinks: { href: Route; label: string }[] = [
  { href: "/dashboard", label: "Check-ins" },
  { href: "/dashboard/next-steps", label: "Next steps" },
  { href: "/account", label: "Account" },
];

export default function Header() {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  // Remembering where the sheet was opened closes it on any navigation, including back/forward.
  const [sheetOpenedOn, setSheetOpenedOn] = useState<string | null>(null);
  const closeSheet = () => setSheetOpenedOn(null);

  const links = isPending ? [] : session ? memberLinks : visitorLinks;
  const current = activeHref(
    pathname,
    links.map((link) => link.href),
  );

  return (
    <header className="header-shadow sticky top-0 z-50 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <Logo />

        {links.length > 0 ? (
          <nav
            aria-label="Main navigation"
            className="hidden items-center rounded-full border border-border bg-card p-1 lg:flex"
          >
            {links.map((link) => {
              const isCurrent = link.href === current;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-4 py-2 font-medium text-[15px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isCurrent
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ModeToggle />
          <UserMenu />
          {!isPending && !session ? (
            <Link href="/signup" className={cn(buttonVariants(), "hidden h-10 sm:inline-flex")}>
              Get started
            </Link>
          ) : null}
          {isPending ? null : (
            <Dialog
              open={sheetOpenedOn === pathname}
              onOpenChange={(open) => setSheetOpenedOn(open ? pathname : null)}
            >
              <DialogTrigger
                aria-label="Open menu"
                render={<Button variant="ghost" size="icon" className="lg:hidden" />}
              >
                <MenuIcon />
              </DialogTrigger>
              {/* zoom-*-100 cancels the dialog's zoom-*-95: cn keeps both, and Tailwind emits the
                  larger value later, so it wins. */}
              <DialogContent className="data-closed:slide-out-to-right data-closed:zoom-out-100 data-open:slide-in-from-right data-open:zoom-in-100 top-0 right-0 left-auto h-dvh max-h-dvh max-w-xs translate-x-0 translate-y-0 content-start rounded-none rounded-l-2xl duration-300 data-closed:duration-200 sm:max-w-xs">
                <DialogHeader>
                  <DialogTitle>Menu</DialogTitle>
                </DialogHeader>
                <nav aria-label="Main navigation" className="flex flex-col gap-1">
                  {links.map((link, index) => {
                    const isCurrent = link.href === current;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={closeSheet}
                        aria-current={isCurrent ? "page" : undefined}
                        style={{ "--i": index } as CSSProperties}
                        className={`stagger animate-rise rounded-full px-5 py-3 font-display text-heading transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          isCurrent ? "bg-accent text-accent-foreground" : "text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
                {session ? null : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={closeSheet}
                      style={{ "--i": links.length } as CSSProperties}
                      className={buttonVariants({
                        variant: "outline",
                        className: "stagger animate-rise",
                      })}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeSheet}
                      style={{ "--i": links.length + 1 } as CSSProperties}
                      className={buttonVariants({ className: "stagger animate-rise" })}
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
