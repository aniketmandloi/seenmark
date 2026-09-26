import { expect, test } from "vitest";

import { activeHref } from "./active-link";

const memberHrefs = ["/dashboard", "/dashboard/next-steps", "/account"];

test("an exact path is active", () => {
  expect(activeHref("/dashboard", memberHrefs)).toBe("/dashboard");
  expect(activeHref("/account", memberHrefs)).toBe("/account");
});

test("the most specific match wins, whatever the order", () => {
  expect(activeHref("/dashboard/next-steps", memberHrefs)).toBe("/dashboard/next-steps");
  expect(activeHref("/dashboard/next-steps", [...memberHrefs].reverse())).toBe(
    "/dashboard/next-steps",
  );
});

test("a nested page marks its parent", () => {
  expect(activeHref("/dashboard/check-ins/abc", memberHrefs)).toBe("/dashboard");
});

test("a shared prefix without a path boundary does not match", () => {
  expect(activeHref("/dashboards", memberHrefs)).toBeUndefined();
  expect(activeHref("/accounting", memberHrefs)).toBeUndefined();
});

test("hash links and the home page are never active elsewhere", () => {
  expect(activeHref("/", ["/#how-it-works"])).toBeUndefined();
  expect(activeHref("/dashboard", ["/"])).toBeUndefined();
});
