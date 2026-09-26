import { cn } from "@seenmark/ui/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-breathe rounded-none bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
