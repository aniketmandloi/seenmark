import { afterEach, beforeEach, expect, test } from "vitest";

import { openTestServer, type TestServer } from "./test-server";

let server: TestServer;

beforeEach(async () => {
  server = await openTestServer();
});

afterEach(async () => {
  await server.client.close();
});

test("a member opens an account, signs in, and reads it back with the session cookie", async () => {
  const opened = await server.trpcMutation("member.openAccount", {
    name: "Ada Member",
    email: "ada@example.com",
    password: "password123",
    affirmedAtLeast18: true,
    affirmedInUnitedStates: true,
  });
  expect(opened.status).toBe(200);

  const cookie = await server.signIn("ada@example.com", "password123");

  const current = await server.trpcQuery("member.current", cookie);
  expect(current.status).toBe(200);
  expect(await current.json()).toEqual({
    result: { data: { affirmedAtLeast18: true, affirmedInUnitedStates: true } },
  });
});

test("member reads without a session cookie are refused", async () => {
  const current = await server.trpcQuery("member.current");
  expect(current.status).toBe(401);
});

test("the raw auth sign-up route is closed, so every account has its affirmations", async () => {
  const signUp = await server.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Blake Member",
      email: "blake@example.com",
      password: "password123",
    }),
  });
  expect(signUp.status).toBe(404);

  const opened = await server.trpcMutation("member.openAccount", {
    name: "Blake Member",
    email: "blake@example.com",
    password: "password123",
    affirmedAtLeast18: true,
    affirmedInUnitedStates: true,
  });
  expect(opened.status).toBe(200);
});
