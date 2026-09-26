import { Skeleton } from "@seenmark/ui/components/skeleton";

/** Shaped like the compare view over the first rows of the timeline. */
export default function CheckInsSkeleton() {
  return (
    <div role="status" aria-label="Loading check-ins">
      <Skeleton className="h-8 w-40 rounded-lg" />
      <div className="mt-5 flex items-end gap-2 sm:gap-3">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="size-10 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
        <Skeleton className="aspect-3/4 rounded-2xl" />
        <Skeleton className="aspect-3/4 rounded-2xl" />
      </div>
      <Skeleton className="mt-12 h-8 w-32 rounded-lg" />
      <div className="mt-6 space-y-3">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    </div>
  );
}
