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

/**
 * Tracks whose reads the cache holds. A session can end without a sign-out (it expires or is
 * revoked) and another member can sign in, so the member screen claims the cache before its
 * first read, and a different member empties it first.
 */
export function createMemberCacheClaim(queryClient: QueryClient) {
  let owner: string | null = null;

  return function claim(memberId: string) {
    if (owner === memberId) return;
    if (owner !== null) {
      void queryClient.cancelQueries();
      queryClient.clear();
    }
    owner = memberId;
  };
}
