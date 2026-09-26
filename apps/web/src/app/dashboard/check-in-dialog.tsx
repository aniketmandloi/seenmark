"use client";

import { Button } from "@seenmark/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@seenmark/ui/components/dialog";
import { Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { type CheckIn, formatDate, relativeTime } from "./check-in-dates";
import DeleteCheckIn from "./delete-check-in";
import Photo from "./photo";

/** The popup mounts only while open, so the photo is fetched only once the check-in is opened. */
export default function CheckInDialog({
  checkIn,
  open,
  now,
  busy,
  onOpenChange,
  onDelete,
}: {
  checkIn: CheckIn | null;
  open: boolean;
  now: number;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [confirming, setConfirming] = useState(false);
  const deleteButton = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open && checkIn !== null} onOpenChange={onOpenChange}>
      {checkIn ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check-in from {formatDate(checkIn.takenAt)}</DialogTitle>
            <DialogDescription className="tabular-nums">
              <time dateTime={checkIn.takenAt}>{relativeTime(checkIn.takenAt, now)}</time>
            </DialogDescription>
          </DialogHeader>
          <Photo
            item={checkIn}
            alt={`Check-in photo from ${formatDate(checkIn.takenAt)}`}
            className="mx-auto max-w-sm"
          />
          <DialogFooter>
            <Button
              ref={deleteButton}
              variant="destructive"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" />
              Delete
            </Button>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          </DialogFooter>
          <DeleteCheckIn
            checkIn={checkIn}
            open={confirming}
            busy={busy}
            finalFocus={deleteButton}
            onOpenChange={setConfirming}
            onDelete={onDelete}
          />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
