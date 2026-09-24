import { expect, test } from "vitest";

import { resolveServerUrl } from "./server-url";

test("an absolute configured URL is used as is, without a trailing slash", () => {
  expect(resolveServerUrl("https://api.example.com/", { env: {}, browserOrigin: null })).toBe(
    "https://api.example.com",
  );
  expect(
    resolveServerUrl("https://api.example.com", {
      env: {},
      browserOrigin: "https://app.example.com",
    }),
  ).toBe("https://api.example.com");
});

test("a relative URL resolves against the page in the browser", () => {
  expect(resolveServerUrl("/api/", { env: {}, browserOrigin: "https://app.example.com" })).toBe(
    "https://app.example.com/api",
  );
});

test("on the Next server an explicit SERVER_URL wins", () => {
  expect(
    resolveServerUrl("/api", {
      env: { SERVER_URL: "http://internal:3000/", VERCEL_URL: "preview.vercel.app" },
      browserOrigin: null,
    }),
  ).toBe("http://internal:3000");
});

test("on the Next server a relative URL uses the deployment origin for its environment", () => {
  const env = {
    VERCEL_URL: "seenmark-git-branch.vercel.app",
    VERCEL_PROJECT_PRODUCTION_URL: "seenmark.app",
  };
  expect(resolveServerUrl("/api", { env, browserOrigin: null })).toBe(
    "https://seenmark-git-branch.vercel.app/api",
  );
  expect(
    resolveServerUrl("/api", { env: { ...env, VERCEL_ENV: "production" }, browserOrigin: null }),
  ).toBe("https://seenmark.app/api");
});

test("on the Next server a relative URL falls back to the local server", () => {
  expect(resolveServerUrl("/api", { env: {}, browserOrigin: null })).toBe(
    "http://localhost:3000/api",
  );
});

test("a missing configured URL is an error, not a guess", () => {
  expect(() => resolveServerUrl(undefined, { env: {}, browserOrigin: null })).toThrow(
    "NEXT_PUBLIC_SERVER_URL is not set",
  );
});
