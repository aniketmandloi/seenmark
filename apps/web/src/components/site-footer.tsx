import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-border/80 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <Link href="/" className="font-semibold text-foreground tracking-[-0.04em]">
          seenmark<span className="text-primary">.</span>
        </Link>
        <p>Your photos, your band, your next step.</p>
        <p>For adults in the United States.</p>
      </div>
    </footer>
  );
}
