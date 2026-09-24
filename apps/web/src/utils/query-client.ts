import { QueryCache, QueryClient } from "@tanstack/react-query";

type ShowError = (message: string, retry: () => void) => void;

/** A query client that reports failed reads with a retry that sends the read again. */
export function createQueryClient(showError: ShowError) {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        showError(error.message, () => {
          void queryClient.refetchQueries({ queryKey: query.queryKey, exact: true });
        });
      },
    }),
  });
  return queryClient;
}
