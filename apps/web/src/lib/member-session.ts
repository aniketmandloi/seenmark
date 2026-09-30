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

type LiveSession = { data: { user: { id: string } } | null; error: unknown };

/**
 * A private screen is rendered on the server for one member, but another tab can sign that member
 * out and someone else in. So the rendered member is only initial data: the live session decides
 * whether the screen is still theirs. A read that is pending or failed changes nothing.
 */
export function memberScreenState(
  live: LiveSession & { isPending: boolean },
  memberId: string,
): "current" | "switched" | "signedOut" {
  if (live.data) return live.data.user.id === memberId ? "current" : "switched";
  return live.isPending || live.error ? "current" : "signedOut";
}

/**
 * Requests carry whichever member's cookie is current when they are sent. So an irreversible
 * command reads the session again first and runs only if it still belongs to the member the
 * screen shows; a failed read counts as someone else. Resolves whether the command ran.
 */
export async function runAsMember(
  memberId: string,
  readSession: () => Promise<LiveSession>,
  command: () => Promise<unknown>,
) {
  const { data, error } = await readSession();
  if (error || data?.user.id !== memberId) return false;
  await command();
  return true;
}
