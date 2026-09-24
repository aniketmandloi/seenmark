import type { Auth, Context as ApiContext } from "@seenmark/api/context";
import type { SignUpLimit } from "@seenmark/api/sign-up-limit";
import type { Database } from "@seenmark/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
  auth: Auth;
  db: Database;
  signUpLimit: SignUpLimit;
};

export async function createContext({
  context,
  auth,
  db,
  signUpLimit,
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
    clientAddress: null,
    signUpLimit,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
