import type { Auth, Context as ApiContext } from "@seenmark/api/context";
import type { Database } from "@seenmark/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
  auth: Auth;
  db: Database;
};

export async function createContext({
  context,
  auth,
  db,
}: CreateContextOptions): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  return {
    db,
    session,
    auth,
    now: () => new Date(),
    paidLinkDestination: null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
