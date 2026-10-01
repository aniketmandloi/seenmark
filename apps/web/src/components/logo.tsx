import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Seenmark home"
      className={`flex w-fit shrink-0 items-center gap-2.5 rounded-full font-display font-semibold text-foreground text-xl tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-5 place-items-center rounded-full border-[2.5px] border-current"
      >
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      seenmark
    </Link>
  );
}
