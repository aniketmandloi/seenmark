import { QueryClient } from "@tanstack/react-query";
import { expect, test } from "vitest";

import {
  createMemberCacheClaim,
  forgetMemberData,
  memberScreenState,
  runAsMember,
} from "./member-session";

test("forgetting member data drops cached reads and ones still in flight", async () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(["checkIn", "photo"], { imageBase64: "cached" });

  let resolveLate: (value: string) => void = () => {};
  const late = queryClient
    .fetchQuery({
      queryKey: ["checkIn", "list"],
      queryFn: () => new Promise<string>((resolve) => (resolveLate = resolve)),
    })
    .catch(() => undefined);

  await forgetMemberData(queryClient);
  resolveLate("previous member's history");
  await late;

  expect(queryClient.getQueryCache().getAll()).toEqual([]);
});

test("a different member claiming the cache empties it, the same member keeps it", () => {
  const queryClient = new QueryClient();
  const claim = createMemberCacheClaim(queryClient);

  claim("member-a");
  queryClient.setQueryData(["checkIn", "photo"], { imageBase64: "a's photo" });

  claim("member-a");
  expect(queryClient.getQueryData(["checkIn", "photo"])).toEqual({ imageBase64: "a's photo" });

  claim("member-b");
  expect(queryClient.getQueryData(["checkIn", "photo"])).toBeUndefined();
});

test("the live session, not the rendered member, decides whose screen it is", () => {
  const signedIn = (id: string) => ({ data: { user: { id } }, error: null, isPending: false });

  expect(memberScreenState(signedIn("member-a"), "member-a")).toBe("current");
  expect(memberScreenState(signedIn("member-b"), "member-a")).toBe("switched");
  expect(memberScreenState({ data: null, error: null, isPending: false }, "member-a")).toBe(
    "signedOut",
  );
  expect(memberScreenState({ data: null, error: null, isPending: true }, "member-a")).toBe(
    "current",
  );
  expect(
    memberScreenState(
      { data: null, error: new TypeError("offline"), isPending: false },
      "member-a",
    ),
  ).toBe("current");
});

test("a command confirmed on a screen for one member never runs as another", async () => {
  let ran = 0;
  const command = async () => {
    ran += 1;
  };
  const session =
    (id: string | null, error: unknown = null) =>
    async () => ({
      data: id ? { user: { id } } : null,
      error,
    });

  expect(await runAsMember("member-a", session("member-b"), command)).toBe(false);
  expect(await runAsMember("member-a", session(null), command)).toBe(false);
  expect(await runAsMember("member-a", session(null, new TypeError("offline")), command)).toBe(
    false,
  );
  expect(ran).toBe(0);

  expect(await runAsMember("member-a", session("member-a"), command)).toBe(true);
  expect(ran).toBe(1);
});
