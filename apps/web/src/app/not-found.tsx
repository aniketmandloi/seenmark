import { buttonVariants } from "@seenmark/ui/components/button";
import Link from "next/link";

import PageHeader from "@/components/page-header";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader
        eyebrow="Page not found"
        title="This page is not here."
        lede="The link may be old, or the address may have a typo."
        actions={
          <Link href="/" className={buttonVariants()}>
            Go to Seenmark
          </Link>
        }
      />
    </div>
  );
}
