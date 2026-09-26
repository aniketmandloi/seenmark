"use client";

import { useMutation } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";

import { queryClient, trpc } from "@/utils/trpc";

import { type Band, bands } from "./bands";
import ChoiceGroup from "./choice-group";
import { invalidateMemberLoop } from "./member-loop";

/** Nothing is chosen until the member chooses (ADR 0005), and no paid link appears here (ADR 0006). */
export default function BandPicker({
  band,
  loading,
  hasCheckIns,
  busy,
}: {
  band: Band | null | undefined;
  loading: boolean;
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

  return (
    <section
      aria-labelledby="band-heading"
      className="rounded-3xl bg-card p-6 shadow-soft ring-1 ring-border/80 sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="band-heading" className="font-display text-heading">
            Choose your band
          </h2>
          <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-6">
            This is your choice after looking at your own check-ins. It is not a diagnosis.
          </p>
        </div>
        {band ? <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary" /> : null}
      </div>

      <ChoiceGroup
        aria-labelledby="band-heading"
        options={bands}
        value={band}
        disabled={!hasCheckIns || busy || loading}
        onChoose={handleChooseBand}
        className="mt-6 grid w-full grid-cols-3"
        itemClassName="h-12 w-full data-pressed:border-primary"
      />
      <p className="mt-3 text-muted-foreground text-xs leading-5">
        You can change your choice whenever you want.
      </p>
    </section>
  );
}
