"use client";

import { ChevronsLeftRight } from "lucide-react";
import { type PointerEvent, useState } from "react";

import { type CheckIn, formatDate } from "./check-in-dates";
import { dividerPercent } from "./comparison";
import Photo from "./photo";

// Pointer events pass through to the frame, so a press never starts a native image drag, which
// would cancel the pointer stream mid-drag.
const layer = "pointer-events-none absolute inset-0 size-full rounded-none";

/**
 * The two photos stacked, with the latest revealed to the right of a divider. Pointer drags move
 * the divider anywhere on the frame; the range input underneath carries it for the keyboard and
 * screen readers.
 */
export default function CompareSlider({ earlier, latest }: { earlier: CheckIn; latest: CheckIn }) {
  const [position, setPosition] = useState(50);

  function follow(event: PointerEvent<HTMLDivElement>) {
    setPosition(dividerPercent(event.clientX, event.currentTarget.getBoundingClientRect()));
  }

  return (
    <figure>
      <div
        className="relative aspect-3/4 w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-2xl bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          follow(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) follow(event);
        }}
      >
        <Photo
          key={earlier.id}
          item={earlier}
          alt={`Earlier check-in photo from ${formatDate(earlier.takenAt)}`}
          className={layer}
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          <Photo
            key={latest.id}
            item={latest}
            alt={`Latest check-in photo from ${formatDate(latest.takenAt)}`}
            className={layer}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background"
          style={{ left: `${position}%` }}
        >
          <span className="absolute top-1/2 left-1/2 grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-background text-foreground shadow-lifted">
            <ChevronsLeftRight className="size-4" />
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          aria-label="Divider between the earlier and latest photos"
          className="sr-only"
          onChange={(event) => setPosition(Number(event.currentTarget.value))}
        />
      </div>
      <figcaption className="mt-3 flex justify-between gap-3 text-muted-foreground text-sm tabular-nums">
        <span>
          <span className="font-medium text-foreground">Earlier</span> ·{" "}
          <time dateTime={earlier.takenAt}>{formatDate(earlier.takenAt)}</time>
        </span>
        <span className="text-right">
          <span className="font-medium text-foreground">Latest</span> ·{" "}
          <time dateTime={latest.takenAt}>{formatDate(latest.takenAt)}</time>
        </span>
      </figcaption>
    </figure>
  );
}
