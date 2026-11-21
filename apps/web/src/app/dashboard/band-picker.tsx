"use client";

import { type Band, bands } from "@seenmark/api/bands";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import ErrorState from "@/components/error-state";
import { invalidateMemberLoop } from "@/lib/member-loop";
import { queryClient, trpc } from "@/utils/trpc";

import ChoiceGroup from "./choice-group";

/** Nothing is chosen until the member chooses (ADR 0005), and no paid link appears here (ADR 0006). */
export default function BandPicker({
  band,
  loading,
  failed,
  retrying,
  onRetry,
  hasCheckIns,
  busy,
}: {
  band: Band | null | undefined;
  loading: boolean;
  /** The saved band could not be read, so choosing would start from a blank that may be wrong. */
  failed: boolean;
  retrying: boolean;
  onRetry: () => void;
  hasCheckIns: boolean;
  busy: boolean;
}) {
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

  async function handleChooseBand(chosen: Band) {
    try {
      await chooseBand.mutateAsync(chosen);
      toast.success("Band saved");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not save your choice.");
    }
  }

  const label = bands.find((option) => option.value === band)?.label;

  return (
    <section
      aria-labelledby="band-heading"
      className="rounded-2xl bg-card p-6 shadow-paper ring-1 ring-border sm:p-8"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-10">
        <div>
          <h2 id="band-heading" className="scroll-mt-24 text-heading">
            Choose your band
          </h2>
          <p className="mt-2 max-w-[46ch] text-muted-foreground leading-7">
            After looking at your photos, how would you describe your hair right now? This is your
            choice, not a diagnosis.
          </p>
        </div>

        <div>
          {failed ? (
            <ErrorState
              message="We could not load your band."
              retrying={retrying}
              onRetry={onRetry}
            />
          ) : loading ? (
            <div role="status" aria-label="Loading your band" className="grid grid-cols-3 gap-2">
              {bands.map((option) => (
                <Skeleton key={option.value} className="h-12 rounded-full" />
              ))}
            </div>
          ) : (
            <ChoiceGroup
              aria-labelledby="band-heading"
              options={bands}
              value={band}
              pendingValue={chooseBand.isPending ? chooseBand.variables : undefined}
              disabled={!hasCheckIns || busy}
              onChoose={handleChooseBand}
              className="grid w-full grid-cols-3"
              itemClassName="h-12 w-full"
            />
          )}
          <p className="mt-3 text-muted-foreground text-sm leading-6">
            {hasCheckIns
              ? "You can change your choice whenever you want."
              : "Add a check-in to choose a band."}
          </p>
        </div>
      </div>

      {/* Steps only on their own page: the early menu's paid link never shares this screen (ADR 0006). */}
      {label ? (
        <p className="mt-6 border-border border-t pt-5">
          <Link
            href="/dashboard/next-steps"
            className="rounded-sm font-medium underline decoration-2 decoration-primary underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the next steps for the {label.toLowerCase()} band
          </Link>
        </p>
      ) : null}
    </section>
  );
}
