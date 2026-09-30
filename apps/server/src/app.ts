import { trpcServer } from "@hono/trpc-server";
import type { Auth } from "@seenmark/api/context";
import { MAX_PHOTO_BASE64_LENGTH } from "@seenmark/api/photo";
import { appRouter } from "@seenmark/api/routers/index";
import { createSignUpLimit } from "@seenmark/api/sign-up-limit";
import type { Database } from "@seenmark/db";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";

// A check-in photo is the largest body any route takes; the rest is JSON framing.
const MAX_BODY_BYTES = MAX_PHOTO_BASE64_LENGTH + 64 * 1024;

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

  app.use(
    "/*",
    bodyLimit({
      maxSize: MAX_BODY_BYTES,
      onError: (c) => c.text("Request body is too large", 413),
    }),
  );

  app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

  // A cross-site HTML form can POST multipart, urlencoded or text/plain with the session
  // cookie and no CORS preflight, and tRPC runs mutations from multipart bodies. Native
  // clients send no Origin, so only a present one is checked.
  app.post("/trpc/*", async (c, next) => {
    if (!/^application\/json\b/i.test(c.req.header("Content-Type") ?? "")) {
      return c.text("tRPC requests must be JSON", 415);
    }
    const origin = c.req.header("Origin");
    if (origin !== undefined && origin !== corsOrigin) {
      return c.text("Origin is not allowed", 403);
    }
    await next();
  });

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
