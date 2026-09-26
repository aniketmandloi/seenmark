import { cn } from "@seenmark/ui/lib/utils";
import { Loader2Icon } from "lucide-react";

/**
 * Decorative: the pending label beside it ("Saving…") is what gets announced. No size class, so
 * a button's own svg sizing applies.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      aria-hidden="true"
      className={cn("animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
