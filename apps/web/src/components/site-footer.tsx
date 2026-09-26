import Link from "next/link";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/dashboard", label: "Check-ins" },
  { href: "/dashboard/next-steps", label: "Next steps" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="border-border/80 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 text-muted-foreground text-sm sm:flex-row sm:items-start sm:justify-between sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3">
          <Link href="/" className="w-fit font-display text-2xl text-foreground">
            seenmark<span className="text-primary">.</span>
          </Link>
          <p>Seenmark does not diagnose or interpret photos.</p>
          <p>For adults in the United States.</p>
        </div>
        <nav aria-label="Footer navigation">
          <ul className="flex flex-col gap-3 sm:items-end">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
