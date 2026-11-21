import { buttonVariants } from "@seenmark/ui/components/button";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import PageHeader from "@/components/page-header";
import { authClient } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Page not found",
};

export default async function NotFound() {
  // A failed session read only changes where the link points, so it never breaks this page.
  const session = await authClient
    .getSession({ fetchOptions: { headers: await headers() } })
    .then((result) => result.data)
    .catch(() => null);
  const member = Boolean(session?.user);

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader
        title="This page is not here."
        lede="The link may be old, or the address may have a typo."
      />
      <Link href={member ? "/dashboard" : "/"} className={buttonVariants({ className: "mt-8" })}>
        {member ? "Go to your check-ins" : "Go to Seenmark"}
      </Link>
    </div>
  );
}
