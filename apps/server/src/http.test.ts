import { MAX_PHOTO_BASE64_LENGTH } from "@seenmark/api/photo";
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

test("opening accounts over HTTP is limited per client address", async () => {
  const open = (name: string, address: string) =>
    server.request("/trpc/member.openAccount", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": address },
      body: JSON.stringify({
        name,
        email: `${name}@example.com`,
        password: "password123",
        affirmedAtLeast18: true,
        affirmedInUnitedStates: true,
      }),
    });

  expect((await open("kai", "203.0.113.7")).status).toBe(200);
  expect((await open("lee", "203.0.113.7")).status).toBe(200);
  expect((await open("max", "203.0.113.7")).status).toBe(200);
  expect((await open("noa", "203.0.113.7, 10.0.0.1")).status).toBe(429);
  expect((await open("noa", "198.51.100.4")).status).toBe(200);
});

test("a body larger than any photo is refused before it reaches a procedure", async () => {
  const response = await server.trpcMutation("checkIn.record", {
    imageBase64: "A".repeat(MAX_PHOTO_BASE64_LENGTH + 128 * 1024),
    mediaType: "image/png",
    takenAt: "2024-09-01T10:00:00.000Z",
  });
  expect(response.status).toBe(413);
});
