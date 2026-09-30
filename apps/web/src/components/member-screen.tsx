"use client";

import { buttonVariants } from "@seenmark/ui/components/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { authClient } from "@/lib/auth-client";
import { forgetMemberData, memberScreenState } from "@/lib/member-session";
import { claimMemberCache, queryClient } from "@/utils/trpc";

import PageHeader from "./page-header";

/** Shows a private screen only while the live session still belongs to the member it was rendered for. */
export default function MemberScreen({
  memberId,
  children,
}: {
  memberId: string;
  children: ReactNode;
}) {
  // Before any read below, so a previous member's cached reads are never shown.
  claimMemberCache(memberId);
  const router = useRouter();
  const state = memberScreenState(authClient.useSession(), memberId);

  useEffect(() => {
    if (state === "current") return;
    void forgetMemberData(queryClient);
    // The page renders again, keyed by whoever is signed in now. A signed-out screen does not
    // navigate itself, because a sign-out in this tab already navigates.
    if (state === "switched") router.refresh();
  }, [state, router]);

  if (state === "current") return children;
  if (state === "switched") return null;
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader title="You are signed out" lede="Sign in again to see your check-ins." />
      <Link href="/login" className={buttonVariants({ className: "mt-8" })}>
        Sign in
      </Link>
    </div>
  );
}
