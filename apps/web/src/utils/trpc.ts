import type { AppRouter } from "@seenmark/api/routers/index";
import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { createMemberCacheClaim } from "@/lib/member-session";
import { resolveServerUrl } from "@/lib/server-url";

// Failed reads are shown inline where they are used, each with its own retry; toasts are for
// mutation results only.
export const queryClient = new QueryClient();

export const claimMemberCache = createMemberCacheClaim(queryClient);

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${resolveServerUrl(process.env.NEXT_PUBLIC_SERVER_URL)}/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
