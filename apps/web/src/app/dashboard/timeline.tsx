"use client";

import { Badge } from "@seenmark/ui/components/badge";
import { Button } from "@seenmark/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@seenmark/ui/components/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { type RefObject, useRef, useState } from "react";

import { type CheckIn, formatDate, groupByMonth, relativeTime } from "./check-in-dates";
import type { Slot } from "./comparison";
import DeleteCheckIn from "./delete-check-in";

const itemClassName = "cursor-pointer rounded-lg px-3 py-2";

/** Dates only: a history page can hold 30 check-ins, and their photos are too heavy to list. */
export default function Timeline({
  items,
  now,
  comparing,
  busy,
  headingRef,
  hasNextPage,
  isFetchingNextPage,
  onShowEarlier,
  onOpen,
  onCompare,
  onDelete,
}: {
  items: CheckIn[];
  now: number;
  comparing: Partial<Record<Slot, CheckIn>>;
  busy: boolean;
  /** Takes focus once a deleted check-in's row, and the menu it was deleted from, are gone. */
  headingRef: RefObject<HTMLHeadingElement | null>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onShowEarlier: () => void;
  onOpen: (id: string) => void;
  onCompare: (slot: Slot, id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  return (
    <section aria-labelledby="timeline-heading">
      <h2
        ref={headingRef}
        id="timeline-heading"
        tabIndex={-1}
        className="font-display text-heading outline-none"
      >
        Timeline
      </h2>
      <p className="mt-2 text-muted-foreground text-sm leading-6">
        Similar light and angle can make it easier to compare later.
      </p>

      <div className="mt-6 space-y-8">
        {groupByMonth(items).map((group) => (
          <section key={group.key} aria-labelledby={`month-${group.key}`}>
            <h3 id={`month-${group.key}`} className="font-medium text-muted-foreground text-sm">
              {group.label}
            </h3>
            <ul className="mt-3 divide-y divide-border/80 rounded-2xl border border-border/80 bg-card">
              {group.items.map((item) => (
                <TimelineRow
                  key={item.id}
                  item={item}
                  newest={item === items[0]}
                  now={now}
                  canCompare={items.length > 1}
                  comparing={comparing}
                  busy={busy}
                  headingRef={headingRef}
                  onOpen={onOpen}
                  onCompare={onCompare}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {hasNextPage ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-6"
          disabled={isFetchingNextPage}
          onClick={onShowEarlier}
        >
          {isFetchingNextPage ? "Loading…" : "Show earlier check-ins"}
        </Button>
      ) : null}
    </section>
  );
}

function TimelineRow({
  item,
  newest,
  now,
  canCompare,
  comparing,
  busy,
  headingRef,
  onOpen,
  onCompare,
  onDelete,
}: {
  item: CheckIn;
  newest: boolean;
  now: number;
  canCompare: boolean;
  comparing: Partial<Record<Slot, CheckIn>>;
  busy: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onOpen: (id: string) => void;
  onCompare: (slot: Slot, id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const date = formatDate(item.takenAt);

  return (
    <li className="flex items-center gap-3 py-2 pr-2 pl-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums">
        <time dateTime={item.takenAt} className="font-medium">
          {date}
        </time>
        <span className="text-muted-foreground">{relativeTime(item.takenAt, now)}</span>
        {newest ? <Badge variant="secondary">Newest</Badge> : null}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          ref={menuTrigger}
          aria-label={`Actions for the check-in from ${date}`}
          render={<Button variant="ghost" size="icon-sm" />}
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48 rounded-xl bg-card p-1.5">
          <DropdownMenuItem className={itemClassName} onClick={() => onOpen(item.id)}>
            Open
          </DropdownMenuItem>
          {canCompare ? (
            <>
              <DropdownMenuItem
                className={itemClassName}
                disabled={comparing.earlier?.id === item.id}
                onClick={() => onCompare("earlier", item.id)}
              >
                Compare as earlier
              </DropdownMenuItem>
              <DropdownMenuItem
                className={itemClassName}
                disabled={comparing.latest?.id === item.id}
                onClick={() => onCompare("latest", item.id)}
              >
                Compare as latest
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator className="my-1" />
          <DropdownMenuItem
            variant="destructive"
            className={itemClassName}
            onClick={() => setConfirming(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteCheckIn
        checkIn={item}
        open={confirming}
        busy={busy}
        finalFocus={() => menuTrigger.current ?? headingRef.current}
        onOpenChange={setConfirming}
        onDelete={onDelete}
      />
    </li>
  );
}
