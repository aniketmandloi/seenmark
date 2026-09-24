import { openTestDatabase } from "@seenmark/api/test-harness";

import { createApp } from "./app";

const ORIGIN = "http://localhost:3000";

export type TestServer = {
  client: Awaited<ReturnType<typeof openTestDatabase>>["client"];
  request: (path: string, init?: RequestInit) => Promise<Response>;
  trpcQuery: (path: string, cookie?: string) => Promise<Response>;
  trpcMutation: (path: string, input?: unknown, cookie?: string) => Promise<Response>;
  signIn: (email: string, password: string) => Promise<string>;
};

/** The real Hono app over a fresh migrated database, driven through HTTP requests. */
export async function openTestServer(): Promise<TestServer> {
  const { client, db, auth } = await openTestDatabase();
  const app = createApp({ auth, db, corsOrigin: ORIGIN, logRequests: false });

  function request(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("Origin", ORIGIN);
    return Promise.resolve(app.request(`${ORIGIN}${path}`, { ...init, headers }));
  }

  function withCookie(cookie: string | undefined, headers: Record<string, string> = {}) {
    return cookie ? { ...headers, Cookie: cookie } : headers;
  }

  return {
    client,
    request,
    trpcQuery: (path, cookie) => request(`/trpc/${path}`, { headers: withCookie(cookie) }),
    trpcMutation: (path, input, cookie) =>
      request(`/trpc/${path}`, {
        method: "POST",
        headers: withCookie(cookie, { "Content-Type": "application/json" }),
        body: input === undefined ? undefined : JSON.stringify(input),
      }),
    async signIn(email, password) {
      const response = await request("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(`Sign-in failed with ${response.status}`);
      }
      return response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    },
  };
}
