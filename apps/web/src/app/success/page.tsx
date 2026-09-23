import { Button } from "@seenmark/ui/components/button";
import { Check } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="rounded-[2rem] border border-border/80 bg-card p-8 text-center shadow-[0_22px_72px_-48px_rgba(31,65,49,0.36)] sm:p-12">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
          <Check aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
          You’re all set
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Your account is ready for your first private check-in.
        </p>
        <Button render={<Link href="/dashboard" />} className="mt-7">
          Go to your check-ins
        </Button>
      </div>
    </div>
  );
}
