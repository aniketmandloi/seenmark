"use client";

import { Badge } from "@seenmark/ui/components/badge";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import ErrorState from "@/components/error-state";
import { trpc } from "@/utils/trpc";

import { type Band, bands } from "./bands";

/** Steps only: the early menu's paid link stays on the next steps page (ADR 0006). */
export default function MenuPreview({ band }: { band: Band }) {
  const menu = useQuery(trpc.menu.current.queryOptions());
  const currentMenu = menu.data?.menu ?? null;
  // The score and the menu are separate reads that can land in either order after a change,
  // so steps show only under the heading of the band they belong to.
  const shownMenu = currentMenu?.band === band ? currentMenu : null;
  const label = bands.find((candidate) => candidate.value === band)?.label;

  return (
    <section
      aria-labelledby="menu-heading"
      className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="menu-heading" className="font-display text-heading">
          Next steps
        </h2>
        <Badge key={band} variant="secondary" className="animate-fade-in">
          {label} band
        </Badge>
      </div>
      <p className="mt-2 text-muted-foreground text-sm leading-6">
        A short menu to read at your pace. These are not a treatment plan.
      </p>

      {menu.isError ? (
        <ErrorState
          className="mt-5"
          message="We could not load your next steps."
          retrying={menu.isFetching}
          onRetry={() => menu.refetch()}
        />
      ) : !shownMenu ? (
        <div className="mt-6 space-y-4" role="status" aria-label="Loading next steps">
          <Skeleton className="h-4 rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
          <Skeleton className="h-4 w-3/5 rounded-md" />
        </div>
      ) : (
        <ol className="mt-6 space-y-4">
          {shownMenu.steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6">
              <span
                aria-hidden="true"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-accent font-medium text-accent-foreground text-xs tabular-nums"
              >
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-6 border-border/70 border-t pt-4 text-sm leading-6">
        <Link
          href="/dashboard/next-steps"
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open your next steps <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </p>
    </section>
  );
}
