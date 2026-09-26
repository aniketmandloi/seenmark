"use client";

import { Button } from "@seenmark/ui/components/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import ErrorState from "@/components/error-state";
import { invalidateMemberLoop } from "@/lib/member-loop";
import { trpc } from "@/utils/trpc";

import type { Band } from "./bands";

export default function IntroductionRequest({
  band,
  busy,
}: {
  band: Band | null | undefined;
  busy: boolean;
}) {
  const introduction = useQuery(trpc.introduction.current.queryOptions());
  const fileIntroduction = useMutation(
    trpc.introduction.file.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeIntroduction = useMutation(
    trpc.introduction.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );

  async function handleIntroduction(action: "file" | "delete") {
    try {
      if (action === "file") {
        await fileIntroduction.mutateAsync();
      } else {
        await removeIntroduction.mutateAsync();
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not update your request.");
    }
  }

  // Filing needs the late band; a request already recorded stays reachable on any band.
  if (band !== "late" && !introduction.data) {
    return null;
  }

  return (
    <section aria-labelledby="introduction-heading" className="rounded-3xl bg-accent/55 p-6 sm:p-8">
      <h2 id="introduction-heading" className="font-semibold text-xl tracking-tight">
        {band === "late" ? "Ask for an introduction" : "Your introduction request"}
      </h2>
      <p className="mt-2 text-muted-foreground text-sm leading-6">
        {band === "late"
          ? "Your request is recorded for you. It is not sent to a clinic."
          : "You asked on the late band. It is still recorded for you, and it is not sent to a clinic."}
      </p>
      {introduction.isError ? (
        <ErrorState
          className="mt-4"
          message="We could not check your request status."
          retrying={introduction.isFetching}
          onRetry={() => introduction.refetch()}
        />
      ) : introduction.data ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-medium text-sm">Request recorded</p>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => handleIntroduction("delete")}
          >
            Remove request
          </Button>
        </div>
      ) : (
        <Button
          className="mt-5"
          disabled={busy || introduction.isLoading}
          onClick={() => handleIntroduction("file")}
        >
          {fileIntroduction.isPending ? "Recording…" : "Record my request"}
        </Button>
      )}
    </section>
  );
}
