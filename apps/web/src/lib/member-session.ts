import type { QueryClient } from "@tanstack/react-query";

/**
 * Member reads are private to the member who made them, and their query keys do not
 * name that member. So the cache is emptied, with in-flight reads cancelled so none can
 * land afterwards, whenever the member it belongs to may have changed.
 */
export async function forgetMemberData(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}
