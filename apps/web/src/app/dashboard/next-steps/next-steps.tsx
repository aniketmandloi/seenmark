"use client";

import { Badge } from "@seenmark/ui/components/badge";
import { buttonVariants } from "@seenmark/ui/components/button";
import { Card, CardContent } from "@seenmark/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@seenmark/ui/components/empty";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import ErrorState from "@/components/error-state";
import PageHeader from "@/components/page-header";
import type { authClient } from "@/lib/auth-client";
import { claimMemberCache, trpc } from "@/utils/trpc";

import { bands } from "../bands";
import IntroductionRequest from "./introduction-request";

/**
 * The menu for the member's chosen band, on its own page. ADR 0006 keeps a paid link off the
 * screen where the band is chosen, so the early menu's paid link appears only here.
 */
export default function NextSteps({ session }: { session: typeof authClient.$Infer.Session }) {
  claimMemberCache(session.user.id);
  const menu = useQuery(trpc.menu.current.queryOptions());
  const currentMenu = menu.data?.menu ?? null;
  const paidLink = currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;
  const bandLabel = bands.find((candidate) => candidate.value === currentMenu?.band)?.label;

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader
        title="Next steps"
        lede="A short menu to read at your pace. These are not a treatment plan."
        actions={
          currentMenu ? (
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{bandLabel} band</Badge>
              <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
                Change band
              </Link>
            </div>
          ) : undefined
        }
      />

      {menu.isLoading ? (
        <StepsSkeleton />
      ) : menu.isError ? (
        <ErrorState
          className="mt-10"
          message="We could not load your next steps."
          retrying={menu.isFetching}
          onRetry={() => menu.refetch()}
        />
      ) : currentMenu ? (
        <ol className="mt-10 divide-y divide-border/70 border-border/70 border-y">
          {currentMenu.steps.map((step, index) => (
            <li key={step} className="flex gap-5 py-6 sm:gap-8">
              <span
                aria-hidden="true"
                className="w-8 shrink-0 font-display text-heading text-primary tabular-nums"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-base leading-7">{step}</p>
            </li>
          ))}
        </ol>
      ) : (
        <Empty className="mt-10 rounded-3xl border border-border bg-card/70">
          <EmptyHeader>
            <h2 className="font-display text-heading">No band chosen yet</h2>
            <EmptyDescription>
              Choose the band that feels right on your check-ins, and the next steps for it appear
              here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard" className={buttonVariants()}>
              Go to your check-ins
            </Link>
          </EmptyContent>
        </Empty>
      )}

      <IntroductionRequest band={currentMenu?.band} />

      {paidLink ? (
        <Card size="sm" className="mt-10">
          <CardContent>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Badge id="paid-link-label" variant="outline">
                {paidLink.label}
              </Badge>
              <a
                href={paidLink.destination}
                target="_blank"
                rel="sponsored noopener noreferrer"
                aria-describedby="paid-link-label"
                className="inline-flex min-w-0 items-center gap-1 break-all font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {paidLink.destination}
                <ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
              </a>
            </p>
            <p className="mt-2 text-muted-foreground text-xs leading-5">
              Seenmark may be paid if you use this link. Who pays never changes your band or these
              steps.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Shaped like the numbered steps. */
function StepsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading next steps"
      className="mt-10 divide-y divide-border/70 border-border/70 border-y"
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-5 py-6 sm:gap-8">
          <Skeleton className="h-7 w-8 shrink-0 rounded-md" />
          <div className="flex-1 space-y-3 pt-1">
            <Skeleton className="h-4 rounded-md" />
            <Skeleton className="h-4 w-3/5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
