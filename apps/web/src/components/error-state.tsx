import { Alert, AlertDescription } from "@seenmark/ui/components/alert";
import { Button } from "@seenmark/ui/components/button";
import { Spinner } from "@seenmark/ui/components/spinner";

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
        aria-busy={retrying || undefined}
        onClick={onRetry}
      >
        {retrying ? <Spinner data-icon="inline-start" /> : null}
        {retrying ? "Trying…" : "Try again"}
      </Button>
    </Alert>
  );
}
