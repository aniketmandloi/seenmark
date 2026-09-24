import type { AppRouter } from "@seenmark/api/routers/index";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

import { createMemberCacheClaim } from "@/lib/member-session";
import { resolveServerUrl } from "@/lib/server-url";

import { createQueryClient } from "./query-client";

export const queryClient = createQueryClient((message, retry) => {
  toast.error(message, { action: { label: "retry", onClick: retry } });
});

export const claimMemberCache = createMemberCacheClaim(queryClient);

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${resolveServerUrl(process.env.NEXT_PUBLIC_SERVER_URL!)}/trpc`,
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
