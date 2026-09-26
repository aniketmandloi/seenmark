"use client";

import { Button } from "@seenmark/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@seenmark/ui/components/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@seenmark/ui/components/select";
import { ArrowLeftRight, Camera } from "lucide-react";
import { useState } from "react";

import { type CheckIn, formatDate, formatDateTime } from "./check-in-dates";
import type { Slot } from "./comparison";
import Photo from "./photo";
import PhotoPicker from "./photo-picker";

const slotLabels: Record<Slot, string> = { earlier: "Earlier", latest: "Latest" };

/**
 * Photos only (ADR 0005): nothing is drawn on or around them that could read as a measurement.
 * Only the two compared photos mount a Photo, so only those two are fetched.
 */
export default function Compare({
  items,
  earlier,
  latest,
  busy,
  onChoose,
  onSwap,
  onAdd,
}: {
  items: CheckIn[];
  earlier: CheckIn | undefined;
  latest: CheckIn | undefined;
  busy: boolean;
  onChoose: (slot: Slot, id: string) => void;
  onSwap: () => void;
  onAdd: (file: File) => void;
}) {
  if (!latest) {
    return <FirstCheckIn busy={busy} onAdd={onAdd} />;
  }

  if (!earlier) {
    return (
      <section aria-labelledby="compare-heading">
        <h2 id="compare-heading" className="font-display text-heading">
          Your baseline
        </h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Take another check-in later to compare.
        </p>
        <figure className="mt-6 max-w-sm">
          <Photo item={latest} alt={`Check-in photo from ${formatDate(latest.takenAt)}`} />
          <CheckInCaption item={latest} />
        </figure>
      </section>
    );
  }

  const slots = { earlier, latest };

  return (
    <section aria-labelledby="compare-heading">
      <h2 id="compare-heading" className="font-display text-heading">
        Compare
      </h2>

      <div className="mt-5 flex items-end gap-2 sm:gap-3">
        <SlotPicker slot="earlier" items={items} slots={slots} onChoose={onChoose} />
        <Button
          variant="outline"
          size="icon"
          aria-label="Swap earlier and latest"
          className="shrink-0"
          onClick={onSwap}
        >
          <ArrowLeftRight aria-hidden="true" />
        </Button>
        <SlotPicker slot="latest" items={items} slots={slots} onChoose={onChoose} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
        {(["earlier", "latest"] as const).map((slot) => (
          <figure key={slot} className="min-w-0">
            <Photo
              item={slots[slot]}
              alt={`${slotLabels[slot]} check-in photo from ${formatDate(slots[slot].takenAt)}`}
            />
            <CheckInCaption item={slots[slot]} />
          </figure>
        ))}
      </div>
    </section>
  );
}

function SlotPicker({
  slot,
  items,
  slots,
  onChoose,
}: {
  slot: Slot;
  items: CheckIn[];
  slots: Record<Slot, CheckIn>;
  onChoose: (slot: Slot, id: string) => void;
}) {
  const labelId = `compare-${slot}-label`;
  const other = slots[slot === "earlier" ? "latest" : "earlier"];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span id={labelId} className="font-medium text-sm">
        {slotLabels[slot]}
      </span>
      <Select
        value={slots[slot].id}
        onValueChange={(id) => {
          if (typeof id === "string") onChoose(slot, id);
        }}
      >
        <SelectTrigger aria-labelledby={labelId} className="w-full tabular-nums">
          <SelectValue>
            {(id: string) => {
              const item = items.find((candidate) => candidate.id === id);
              return item ? formatDate(item.takenAt) : null;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem
              key={item.id}
              value={item.id}
              disabled={item.id === other.id}
              className="tabular-nums"
            >
              {formatDateTime(item.takenAt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CheckInCaption({ item }: { item: CheckIn }) {
  return (
    <figcaption className="mt-3 text-muted-foreground text-sm tabular-nums">
      <time dateTime={item.takenAt}>{formatDate(item.takenAt)}</time>
    </figcaption>
  );
}

function FirstCheckIn({ busy, onAdd }: { busy: boolean; onAdd: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <Empty
      className={`rounded-3xl border transition-colors ${
        dragging ? "border-primary bg-accent/50" : "border-border bg-card/70"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file && !busy) onAdd(file);
      }}
    >
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-accent text-primary">
          <Camera aria-hidden="true" className="size-6" />
        </EmptyMedia>
        <h2 className="font-display text-heading">Start with one photo</h2>
        <EmptyDescription>
          Take a clear photo of your own hairline, or drop one here. You can add another check-in
          whenever you want.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <PhotoPicker disabled={busy} label="Add your first check-in" onFile={onAdd} />
        <p className="text-muted-foreground text-xs leading-5">On mobile, you can take one now.</p>
      </EmptyContent>
    </Empty>
  );
}
