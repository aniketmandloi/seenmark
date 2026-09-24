import { trpcServer } from "@hono/trpc-server";
import type { Auth } from "@seenmark/api/context";
import { appRouter } from "@seenmark/api/routers/index";
import { createSignUpLimit } from "@seenmark/api/sign-up-limit";
import type { Database } from "@seenmark/db";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";

export type AppServices = {
  auth: Auth;
  db: Database;
  corsOrigin: string;
  logRequests?: boolean;
};

export function createApp({ auth, db, corsOrigin, logRequests = true }: AppServices) {
  const app = new Hono();
  const signUpLimit = createSignUpLimit();

  if (logRequests) {
    app.use(logger());
  }
  app.use(
    "/*",
    cors({
      origin: corsOrigin,
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

  app.use(
    "/trpc/*",
    trpcServer({
      router: appRouter,
      createContext: (_opts, context) => {
        return createContext({ context, auth, db, signUpLimit });
      },
    }),
  );

  app.get("/", (c) => {
    return c.text("OK");
  });

  return app;
}
