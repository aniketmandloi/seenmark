import type { HttpBindings } from "@hono/node-server";
import type { Context as ApiContext, Auth } from "@seenmark/api/context";
import type { Database } from "@seenmark/db";
import type { Context as HonoContext } from "hono";

export type CreateContextOptions = {
  context: HonoContext;
  auth: Auth;
  db: Database;
  behindVercel: boolean;
};

// Vercel overwrites X-Real-IP with the caller's address. A directly exposed Node
// server passes on whatever the caller sent, so there only the socket is trusted.
function clientAddressOf(context: HonoContext, behindVercel: boolean) {
  if (behindVercel) {
    return context.req.header("x-real-ip") ?? null;
  }
  const bindings = context.env as Partial<HttpBindings> | undefined;
  return bindings?.incoming?.socket.remoteAddress ?? null;
}

export async function createContext({
  context,
  auth,
  db,
  behindVercel,
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
    clientAddress: clientAddressOf(context, behindVercel),
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
