"use client";

import { HISTORY_PAGE_SIZE, nextHistoryCursor } from "@seenmark/api/history";
import { Alert, AlertDescription } from "@seenmark/ui/components/alert";
import { useInfiniteQuery, useIsMutating, useMutation, useQuery } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import ErrorState from "@/components/error-state";
import PageHeader from "@/components/page-header";
import type { authClient } from "@/lib/auth-client";
import { claimMemberCache, queryClient, trpc } from "@/utils/trpc";

import AccountPrivacy from "./account-privacy";
import BandPicker from "./band-picker";
import { type CheckIn, formatDate, relativeTime } from "./check-in-dates";
import CheckInDialog from "./check-in-dialog";
import Compare from "./compare";
import { type ComparisonChoice, chooseSlot, defaultChoice, resolveComparison } from "./comparison";
import IntroductionRequest from "./introduction-request";
import { invalidateMemberLoop } from "./member-loop";
import MenuPreview from "./menu-preview";
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
  const record = useMutation(
    trpc.checkIn.record.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeCheckIn = useMutation(
    trpc.checkIn.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );

  const mutations = useIsMutating();

  const items: CheckIn[] = checkIns.data?.pages.flat() ?? [];
  const comparison = resolveComparison(items, choice);
  const latest = items[0];
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
          <BandPicker
            band={currentBand.data}
            loading={currentBand.isLoading}
            hasCheckIns={items.length > 0}
            busy={isBusy}
          />

          {currentBand.data ? <MenuPreview band={currentBand.data} /> : null}

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
