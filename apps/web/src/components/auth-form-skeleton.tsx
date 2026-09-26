import { Skeleton } from "@seenmark/ui/components/skeleton";

export default function AuthFormSkeleton({
  fields,
  affirmations = [],
}: {
  fields: string[];
  affirmations?: string[];
}) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your account</span>
      <div className="mb-7 space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 max-w-full rounded-md" />
      </div>
      <div className="space-y-5">
        {fields.map((field) => (
          <div key={field} className="space-y-2">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        {affirmations.length > 0 ? (
          <div className="space-y-3 border-border/70 border-t pt-4">
            {affirmations.map((affirmation) => (
              <div key={affirmation} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-md" />
                <Skeleton className="h-4 w-64 max-w-full rounded-md" />
              </div>
            ))}
          </div>
        ) : null}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}
