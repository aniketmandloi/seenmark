"use client";

import { Button } from "@seenmark/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";

import type { authClient } from "@/lib/auth-client";
import { claimMemberCache, trpc } from "@/utils/trpc";

const bandLabels = { early: "Early", mid: "Mid", late: "Late" } as const;

/**
 * The menu for the member's chosen band, on its own page. ADR 0006 keeps a paid link off the
 * screen where the band is chosen, so the early menu's paid link appears only here.
 */
export default function NextSteps({ session }: { session: typeof authClient.$Infer.Session }) {
  claimMemberCache(session.user.id);
  const menu = useQuery(trpc.menu.current.queryOptions());
  const currentMenu = menu.data?.menu ?? null;
  const paidLink = currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 pt-10 sm:px-8 md:pt-14">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to your check-ins
      </Link>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">
        {currentMenu ? `Next steps for ${bandLabels[currentMenu.band]}` : "Next steps"}
      </h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        A short menu to read at your pace. These are not a treatment plan.
      </p>

      {menu.isLoading ? (
        <div className="mt-8 space-y-3" role="status" aria-label="Loading next steps">
          <div className="h-4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        </div>
      ) : menu.isError ? (
        <div role="alert" className="mt-8 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          <p>We could not load your next steps.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => menu.refetch()}>
            Try again
          </Button>
        </div>
      ) : currentMenu ? (
        <ol className="mt-8 space-y-4">
          {currentMenu.steps.map((step) => (
            <li key={step} className="flex gap-3 text-sm leading-6">
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 text-sm leading-6 text-muted-foreground">
          Choose the band that feels right on your check-ins, and the next steps for it appear here.
        </p>
      )}

      {paidLink ? (
        <p className="mt-8 border-t border-border/70 pt-4 text-sm leading-6">
          <span className="font-semibold">{paidLink.label}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <a
            href={paidLink.destination}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Visit link <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </p>
      ) : null}
    </div>
  );
}
