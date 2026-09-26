"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@seenmark/ui/components/alert-dialog";
import { Badge } from "@seenmark/ui/components/badge";
import { Button } from "@seenmark/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from "@seenmark/ui/components/card";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type RefObject, useRef, useState } from "react";
import { toast } from "sonner";

import ErrorState from "@/components/error-state";
import { invalidateMemberLoop } from "@/lib/member-loop";
import { trpc } from "@/utils/trpc";

import type { Band } from "../bands";
import { formatDate, relativeTime } from "../check-in-dates";

export default function IntroductionRequest({
  band,
  fallbackFocus,
}: {
  band: Band | undefined;
  /** Takes focus when removing the request hides this whole section (any band but late). */
  fallbackFocus: RefObject<HTMLElement | null>;
}) {
  // Relative times are hints, so they are measured from when the page opened.
  const [now] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const removeTrigger = useRef<HTMLButtonElement>(null);
  const introduction = useQuery(trpc.introduction.current.queryOptions());
  const fileIntroduction = useMutation(
    trpc.introduction.file.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeIntroduction = useMutation(
    trpc.introduction.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );

  async function handleFile() {
    try {
      await fileIntroduction.mutateAsync();
      toast.success("Introduction request recorded");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not record your request.");
    }
  }

  async function handleRemove() {
    try {
      await removeIntroduction.mutateAsync();
      setConfirmOpen(false);
      toast.success("Introduction request removed");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not remove your request.");
    }
  }

  // Filing needs the late band; a request already recorded stays reachable on any band.
  if (band !== "late" && !introduction.data) {
    return null;
  }

  const recorded = introduction.data;

  return (
    <section aria-labelledby="introduction-heading" className="mt-12">
      <Card className="bg-accent/40">
        <CardHeader>
          <h2
            ref={heading}
            id="introduction-heading"
            tabIndex={-1}
            className="font-display text-heading outline-none"
          >
            {band === "late" ? "Ask for an introduction" : "Your introduction request"}
          </h2>
          <CardDescription>
            {band === "late"
              ? "Your request is recorded for you. It is not sent to a clinic."
              : "You asked on the late band. It is still recorded for you, and it is not sent to a clinic."}
          </CardDescription>
          {recorded ? (
            <CardAction>
              <Badge variant="success">Recorded</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          {introduction.isError ? (
            <ErrorState
              message="We could not check your request status."
              retrying={introduction.isFetching}
              onRetry={() => introduction.refetch()}
            />
          ) : introduction.isLoading ? (
            <Skeleton
              role="status"
              aria-label="Loading your request"
              className="h-11 w-44 rounded-xl"
            />
          ) : recorded ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm tabular-nums">
                Recorded on <time dateTime={recorded.filedAt}>{formatDate(recorded.filedAt)}</time>{" "}
                · {relativeTime(recorded.filedAt, now)}
              </p>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger ref={removeTrigger} render={<Button variant="outline" />}>
                  Remove request
                </AlertDialogTrigger>
                <AlertDialogContent
                  // A removed request takes its trigger with it, and off the late band the whole
                  // section too.
                  finalFocus={() =>
                    removeTrigger.current ?? heading.current ?? fallbackFocus.current
                  }
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove your introduction request?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {band === "late"
                        ? "You can ask again whenever you want."
                        : "To ask again, you would choose the late band first."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={removeIntroduction.isPending}
                      onClick={handleRemove}
                    >
                      {removeIntroduction.isPending ? "Removing…" : "Remove request"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Button disabled={fileIntroduction.isPending} onClick={handleFile}>
              {fileIntroduction.isPending ? "Recording…" : "Record my request"}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
