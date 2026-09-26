"use client";

import { Skeleton } from "@seenmark/ui/components/skeleton";
import { cn } from "@seenmark/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import ErrorState from "@/components/error-state";
import { trpc } from "@/utils/trpc";

import type { CheckIn } from "./check-in-dates";

export default function Photo({
  item,
  alt,
  className,
}: {
  item: CheckIn;
  alt: string;
  className?: string;
}) {
  // A recorded photo never changes, so once loaded it is never refetched.
  const photo = useQuery({
    ...trpc.checkIn.photo.queryOptions({ id: item.id }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (photo.isError && !photo.data) {
    return (
      <div
        className={cn(
          "grid aspect-3/4 w-full place-items-center rounded-2xl bg-muted p-4",
          className,
        )}
      >
        <ErrorState
          message="This photo could not load."
          retrying={photo.isFetching}
          onRetry={() => photo.refetch()}
        />
      </div>
    );
  }

  if (!photo.data) {
    return (
      <Skeleton
        role="status"
        aria-label="Loading photo"
        className={cn("aspect-3/4 w-full rounded-2xl", className)}
      />
    );
  }

  return (
    <Image
      src={`data:${photo.data.mediaType};base64,${photo.data.imageBase64}`}
      alt={alt}
      width={900}
      height={1200}
      unoptimized
      className={cn("aspect-3/4 w-full rounded-2xl bg-muted object-cover", className)}
    />
  );
}
