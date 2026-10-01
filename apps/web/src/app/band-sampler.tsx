"use client";

import { useState } from "react";

const bands = [
  {
    name: "Early",
    focus: "Habits",
    description:
      "Everyday habits worth knowing: taking later photos in similar light, being gentle with heat and tension, and noticing shedding without keeping score.",
  },
  {
    name: "Mid",
    focus: "Who to talk to",
    description:
      "A prescriber is who discusses medicines. The mid menu says who that conversation is with, not what to take.",
  },
  {
    name: "Late",
    focus: "A clinic conversation",
    description:
      "What a clinic conversation is, and what verified means: a clinic Seenmark has checked for a named US-licensed physician, a published price range, and result photos at least 12 months out that aren't the clinic's ads. No clinic is verified yet, and there's no directory.",
  },
];

/** Like the real band choice, nothing is chosen until the visitor chooses. */
export default function BandSampler() {
  const [chosen, setChosen] = useState<string | null>(null);
  const band = bands.find((candidate) => candidate.name === chosen);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
      <fieldset className="rounded-2xl border border-border bg-card p-6 md:p-10 lg:col-span-7">
        <legend className="float-left font-display text-heading">
          How would you describe your hair right now?
        </legend>
        <div className="clear-left grid gap-3 pt-6">
          {bands.map((option) => {
            const isChosen = option.name === chosen;
            return (
              <button
                key={option.name}
                type="button"
                aria-pressed={isChosen}
                onClick={() => setChosen(option.name)}
                className={`flex items-baseline justify-between gap-4 rounded-xl border-2 px-5 py-4 text-left outline-none transition-[background-color,border-color,scale] duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-99 ${
                  isChosen
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                <span className="font-display font-semibold text-2xl tracking-tight md:text-3xl">
                  {option.name}
                </span>
                <span className={isChosen ? "font-medium" : "text-muted-foreground"}>
                  {option.focus}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <aside
        aria-live="polite"
        className="rounded-2xl border border-foreground/30 border-dashed p-6 md:p-8 lg:col-span-5"
      >
        {band ? (
          <div key={band.name} className="animate-rise">
            <h3 className="font-display text-heading">
              {band.name}: {band.focus.toLowerCase()}
            </h3>
            <p className="mt-4 text-lg text-muted-foreground leading-snug">{band.description}</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-heading">Its menu</h3>
            <p className="mt-4 max-w-[32ch] text-lg text-muted-foreground leading-snug">
              Nothing chosen yet. Seenmark never picks a band for you, so this waits for you too.
            </p>
          </>
        )}
        <p className="mt-8 border-border border-t pt-5 text-muted-foreground text-sm leading-6">
          Every menu is educational. None tells you what to start or promises a result.
        </p>
      </aside>
    </div>
  );
}
