import { Button } from "@seenmark/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-3xl content-center px-5 py-16 text-center sm:px-8">
      <p className="text-sm font-semibold text-primary">Page not found</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
        This page is not here.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
        The link may be old, or the address may have a typo.
      </p>
      <Button render={<Link href="/" />} className="mx-auto mt-7">
        Go to Seenmark
      </Button>
    </div>
  );
}
