import { Alert, AlertDescription } from "@seenmark/ui/components/alert";
import { Button } from "@seenmark/ui/components/button";

export default function ErrorState({
  message,
  onRetry,
  retrying = false,
  className,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertDescription>{message}</AlertDescription>
      <Button
        variant="outline"
        size="sm"
        className="mt-2 justify-self-start"
        disabled={retrying}
        onClick={onRetry}
      >
        {retrying ? "Trying…" : "Try again"}
      </Button>
    </Alert>
  );
}
