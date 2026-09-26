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
} from "@seenmark/ui/components/alert-dialog";
import { type ComponentProps, useState } from "react";

import { type CheckIn, formatDate } from "./check-in-dates";

export default function DeleteCheckIn({
  checkIn,
  open,
  busy,
  finalFocus,
  onOpenChange,
  onDelete,
}: {
  checkIn: CheckIn;
  open: boolean;
  busy: boolean;
  /** Where focus returns on close, for a dialog opened from a menu item that no longer exists. */
  finalFocus?: ComponentProps<typeof AlertDialogContent>["finalFocus"];
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [deleting, setDeleting] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent finalFocus={finalFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete the check-in from {formatDate(checkIn.takenAt)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This also removes the photo from your record.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setDeleting(true);
              const deleted = await onDelete(checkIn.id);
              setDeleting(false);
              if (deleted) onOpenChange(false);
            }}
          >
            {deleting ? "Deleting…" : "Delete photo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
