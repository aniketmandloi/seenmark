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

// Vercel and most proxies put the caller first in x-forwarded-for.
function clientAddressOf(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || null;
}

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
    clientAddress: clientAddressOf(context.req.raw.headers),
    signUpLimit,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
