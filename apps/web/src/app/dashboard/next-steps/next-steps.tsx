"use client";

import { bands } from "@seenmark/api/bands";
import { Badge } from "@seenmark/ui/components/badge";
import { buttonVariants } from "@seenmark/ui/components/button";
import { Card, CardContent } from "@seenmark/ui/components/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@seenmark/ui/components/empty";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useRef } from "react";

import ErrorState from "@/components/error-state";
import MarginSection from "@/components/margin-section";
import PageHeader from "@/components/page-header";
import { trpc } from "@/utils/trpc";

import IntroductionRequest from "./introduction-request";

/**
 * The menu for the member's chosen band, on its own page. ADR 0006 keeps a paid link off the
 * screen where the band is chosen, so the early menu's paid link appears only here.
 */
export default function NextSteps() {
  const menu = useQuery(trpc.menu.current.queryOptions());
  const currentMenu = menu.data?.menu ?? null;
  const paidLink = currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;
  const bandLabel = bands.find((candidate) => candidate.value === currentMenu?.band)?.label;
  const title = useRef<HTMLHeadingElement>(null);

  return (
    <div className="mx-auto max-w-4xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader
        titleRef={title}
        title="Next steps"
        lede="A short menu to read at your pace. These are not a treatment plan."
        actions={
          currentMenu ? (
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Change band
            </Link>
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
        <MarginSection id="menu-band-heading" heading={`${bandLabel} band`} className="mt-12">
          <ul className="divide-y divide-border/70 border-border/70 border-y lg:border-t-0">
            {currentMenu.steps.map((step, index) => (
              <li
                key={step}
                className="stagger flex animate-rise gap-5 py-6 sm:gap-6 lg:first:pt-1"
                style={{ "--i": index } as CSSProperties}
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-3 w-5 shrink-0 -rotate-6 rounded-[3px] bg-primary ring-1 ring-foreground/20"
                />
                <p className="text-lg leading-7">{step}</p>
              </li>
            ))}
          </ul>
        </MarginSection>
      ) : (
        <Empty className="mt-10 animate-fade-in rounded-2xl border-2 border-border border-dashed bg-card">
          <EmptyHeader>
            <h2 className="text-heading">No band chosen yet</h2>
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

      {/* Lines up with the entry column of the margin layout above. */}
      <div className="lg:pl-[13.5rem]">
        <IntroductionRequest band={currentMenu?.band} fallbackFocus={title} />

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
                  className="inline-flex min-w-0 items-center gap-1 break-all font-medium text-foreground underline decoration-2 decoration-primary underline-offset-4 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </div>
  );
}

/** Shaped like the marked steps. */
function StepsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading next steps"
      className="mt-10 divide-y divide-border/70 border-border/70 border-y"
    >
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-5 py-6 sm:gap-8">
          <Skeleton className="mt-2 h-3 w-5 shrink-0 rounded-[3px]" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 rounded-md" />
            <Skeleton className="h-4 w-3/5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
