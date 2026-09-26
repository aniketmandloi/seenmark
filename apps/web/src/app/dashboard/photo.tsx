"use client";

import { Button } from "@seenmark/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

import { trpc } from "@/utils/trpc";

import type { CheckIn } from "./check-in-dates";

export default function Photo({ item, alt }: { item: CheckIn; alt: string }) {
  // A recorded photo never changes, so once loaded it is never refetched.
  const photo = useQuery({
    ...trpc.checkIn.photo.queryOptions({ id: item.id }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (photo.isError && !photo.data) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center rounded-2xl bg-muted p-4 text-center">
        <div role="alert">
          <p className="text-muted-foreground text-sm">This photo could not load.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={photo.isFetching}
            onClick={() => photo.refetch()}
          >
            {photo.isFetching ? "Trying…" : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  if (!photo.data) {
    return (
      <div
        role="status"
        aria-label="Loading photo"
        className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
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
      className="aspect-[3/4] w-full rounded-2xl bg-muted object-cover"
    />
  );
}
