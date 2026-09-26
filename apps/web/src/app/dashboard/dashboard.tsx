"use client";

import { HISTORY_PAGE_SIZE, nextHistoryCursor } from "@seenmark/api/history";
import { Alert, AlertDescription } from "@seenmark/ui/components/alert";
import { Button } from "@seenmark/ui/components/button";
import { useInfiniteQuery, useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Check, Clock3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import ErrorState from "@/components/error-state";
import PageHeader from "@/components/page-header";
import type { authClient } from "@/lib/auth-client";
import { claimMemberCache, queryClient, trpc } from "@/utils/trpc";

import AccountPrivacy from "./account-privacy";
import { type Band, bands } from "./bands";
import { type CheckIn, formatDate, relativeTime } from "./check-in-dates";
import CheckInDialog from "./check-in-dialog";
import Compare from "./compare";
import { type ComparisonChoice, chooseSlot, defaultChoice, resolveComparison } from "./comparison";
import IntroductionRequest from "./introduction-request";
import { invalidateMemberLoop } from "./member-loop";
import PhotoPicker from "./photo-picker";
import { preparePhoto } from "./prepare-photo";
import Timeline from "./timeline";

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  // Before any read below, so a previous member's cached reads are never shown.
  claimMemberCache(session.user.id);
  const [choice, setChoice] = useState<ComparisonChoice>(defaultChoice);
  // Kept after the dialog closes, so its content stays put while it animates out.
  const [opened, setOpened] = useState<CheckIn | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Relative times are hints, so they are measured from when the dashboard opened.
  const [now] = useState(() => Date.now());
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const checkIns = useInfiniteQuery(
    trpc.checkIn.list.infiniteQueryOptions(
      { limit: HISTORY_PAGE_SIZE },
      { getNextPageParam: nextHistoryCursor },
    ),
  );
  const currentBand = useQuery(trpc.score.current.queryOptions());
  const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
  const menu = useQuery(trpc.menu.current.queryOptions());
  const record = useMutation(
    trpc.checkIn.record.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeCheckIn = useMutation(
    trpc.checkIn.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const chooseBand = useMutation(
    trpc.score.choose.mutationOptions({
      onSuccess: async (chosen) => {
        // The saved band is confirmed by this reply, and the old band's menu no longer applies.
        queryClient.setQueryData(trpc.score.current.queryKey(), chosen.band);
        await queryClient.resetQueries({ queryKey: trpc.menu.current.queryKey() });
        await invalidateMemberLoop();
      },
    }),
  );

  const mutations = useIsMutating();

  const items: CheckIn[] = checkIns.data?.pages.flat() ?? [];
  const comparison = resolveComparison(items, choice);
  const latest = items[0];
  const selectedBand = bands.find((band) => band.value === currentBand.data)?.label;
  const currentMenu = menu.data?.menu ?? null;
  // The score and the menu are separate reads that can land in either order after a change,
  // so steps show only under the heading of the band they belong to.
  const shownMenu = currentMenu?.band === currentBand.data ? currentMenu : null;
  const isBusy = isPreparingPhoto || mutations > 0;

  async function addCheckIn(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file to add a check-in.");
      return;
    }

    setIsPreparingPhoto(true);

    try {
      await record.mutateAsync({
        ...(await preparePhoto(file)),
        takenAt: new Date().toISOString(),
      });
      setChoice(defaultChoice);
      toast.success("Check-in saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not save that check-in.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  async function handleDeleteCheckIn(id: string): Promise<boolean> {
    try {
      await removeCheckIn.mutateAsync({ id });
      if (opened?.id === id) {
        setDialogOpen(false);
      }
      // Photos never go stale, so a deleted one stays readable until evicted; a read still
      // in flight is cancelled so it cannot put the photo back.
      const photoKey = trpc.checkIn.photo.queryKey({ id });
      await queryClient.cancelQueries({ queryKey: photoKey });
      queryClient.removeQueries({ queryKey: photoKey });
      toast.success("Check-in deleted");
      return true;
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not delete that check-in.");
      return false;
    }
  }

  async function handleChooseBand(band: Band) {
    try {
      await chooseBand.mutateAsync(band);
      toast.success("Band saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not save your choice.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pt-10 pb-16 sm:px-8 md:pt-14 lg:px-10">
      <PageHeader
        eyebrow="Only you can see your photos"
        title="Your check-ins"
        lede={
          latest ? (
            <span className="tabular-nums">
              {items.length}
              {checkIns.hasNextPage ? "+" : ""} {items.length === 1 ? "check-in" : "check-ins"} ·
              last one{" "}
              <time dateTime={latest.takenAt} title={formatDate(latest.takenAt)}>
                {relativeTime(latest.takenAt, now)}
              </time>
            </span>
          ) : undefined
        }
        actions={<PhotoPicker disabled={isBusy} label="Add check-in" onFile={addCheckIn} />}
      />

      {reminder.data?.due ? (
        <Alert role="status" className="mt-6 bg-accent/50">
          <Clock3 aria-hidden="true" />
          <AlertDescription>{reminder.data.invitation}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {checkIns.isLoading ? (
            <div className="grid grid-cols-2 gap-4" role="status" aria-label="Loading check-ins">
              <div className="aspect-3/4 animate-pulse rounded-2xl bg-muted" />
              <div className="aspect-3/4 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : checkIns.isError ? (
            <ErrorState
              message={
                checkIns.error.message || "Your check-ins are unavailable. Try again in a moment."
              }
              retrying={checkIns.isFetching}
              onRetry={() => checkIns.refetch()}
            />
          ) : (
            <>
              <Compare
                items={items}
                earlier={comparison.earlier}
                latest={comparison.latest}
                busy={isBusy}
                onChoose={(slot, id) => setChoice(chooseSlot(comparison, slot, id))}
                onSwap={() =>
                  setChoice({
                    earlierId: comparison.latest?.id ?? null,
                    latestId: comparison.earlier?.id ?? null,
                  })
                }
                onAdd={addCheckIn}
              />

              {items.length > 0 ? (
                <div className="mt-12">
                  <Timeline
                    items={items}
                    now={now}
                    comparing={comparison}
                    busy={isBusy}
                    hasNextPage={checkIns.hasNextPage}
                    isFetchingNextPage={checkIns.isFetchingNextPage}
                    onShowEarlier={() => checkIns.fetchNextPage()}
                    onOpen={(id) => {
                      setOpened(items.find((item) => item.id === id) ?? null);
                      setDialogOpen(true);
                    }}
                    onCompare={(slot, id) => {
                      setChoice(chooseSlot(comparison, slot, id));
                      document
                        .getElementById("compare-heading")
                        ?.scrollIntoView({ block: "start" });
                    }}
                    onDelete={handleDeleteCheckIn}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="space-y-8">
          <section
            aria-labelledby="band-heading"
            className="rounded-[1.75rem] bg-card p-6 ring-1 ring-border/80 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="band-heading" className="font-semibold text-2xl tracking-[-0.04em]">
                  Choose your band
                </h2>
                <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-6">
                  This is your choice after looking at your own check-ins. It is not a diagnosis.
                </p>
              </div>
              {currentBand.data ? (
                <Check aria-hidden="true" className="mt-1 size-5 text-primary" />
              ) : null}
            </div>

            <fieldset
              aria-labelledby="band-heading"
              className="mt-6 grid min-w-0 grid-cols-3 gap-2"
            >
              {bands.map((band) => {
                const selected = currentBand.data === band.value;
                return (
                  <button
                    key={band.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={items.length === 0 || isBusy || currentBand.isLoading}
                    onClick={() => handleChooseBand(band.value)}
                    className={`min-h-12 rounded-xl border px-2 font-semibold text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/60 hover:bg-accent/50"
                    }`}
                  >
                    {band.label}
                  </button>
                );
              })}
            </fieldset>
            <p className="mt-3 text-muted-foreground text-xs leading-5">
              You can change your choice whenever you want.
            </p>
          </section>

          {currentBand.data ? (
            <section
              aria-labelledby="menu-heading"
              className="rounded-[1.75rem] border border-border/80 bg-card p-6 sm:p-8"
            >
              <h2 id="menu-heading" className="font-semibold text-2xl tracking-[-0.04em]">
                Next steps for {selectedBand}
              </h2>
              <p className="mt-2 text-muted-foreground text-sm leading-6">
                A short menu to read at your pace. These are not a treatment plan.
              </p>

              {menu.isError ? (
                <div
                  role="alert"
                  className="mt-5 rounded-xl bg-destructive/10 p-4 text-destructive text-sm"
                >
                  <p>We could not load your next steps.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => menu.refetch()}
                  >
                    Try again
                  </Button>
                </div>
              ) : !shownMenu ? (
                <div className="mt-6 space-y-3" role="status" aria-label="Loading next steps">
                  <div className="h-4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                </div>
              ) : (
                <ol className="mt-6 space-y-4">
                  {shownMenu.steps.map((step) => (
                    <li key={step} className="flex gap-3 text-sm leading-6">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
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
          ) : null}

          <IntroductionRequest band={currentBand.data} busy={isBusy} />

          <AccountPrivacy />
        </aside>
      </div>

      <CheckInDialog
        checkIn={opened}
        open={dialogOpen}
        now={now}
        busy={isBusy}
        onOpenChange={setDialogOpen}
        onDelete={handleDeleteCheckIn}
      />
    </div>
  );
}
