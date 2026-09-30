import type { AppRouter } from "@seenmark/api/routers/index";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { createMemberCacheClaim } from "@/lib/member-session";
import { resolveServerUrl } from "@/lib/server-url";

// Failed reads are shown inline where they are used, each with its own retry; toasts are for
// mutation results only.
export const queryClient = new QueryClient();

export const claimMemberCache = createMemberCacheClaim(queryClient);

const url = `${resolveServerUrl(process.env.NEXT_PUBLIC_SERVER_URL)}/trpc`;

function fetchWithCookies(input: RequestInfo | URL, options?: RequestInit) {
  return fetch(input, {
    ...options,
    credentials: "include",
  });
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    // A photo is up to 4 MiB as base64, so two in one batched response pass Vercel's 4.5 MB cap.
    splitLink({
      condition: (op) => op.path === "checkIn.photo",
      true: httpLink({ url, fetch: fetchWithCookies }),
      false: httpBatchLink({ url, fetch: fetchWithCookies }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
