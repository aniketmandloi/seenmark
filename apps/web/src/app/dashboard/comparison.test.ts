import { expect, test } from "vitest";

import { chooseSlot, defaultChoice, dividerPercent, resolveComparison } from "./comparison";

const items = ["d", "c", "b", "a"].map((id) => ({ id, takenAt: "2026-06-01T12:00:00.000Z" }));
const ids = (pair: { earlier?: { id: string }; latest?: { id: string } }) => [
  pair.earlier?.id,
  pair.latest?.id,
];

test("by default the newest check-in is compared with the one before it", () => {
  expect(ids(resolveComparison(items, defaultChoice))).toEqual(["c", "d"]);
});

test("one check-in fills only the latest slot, and none fills neither", () => {
  expect(ids(resolveComparison(items.slice(0, 1), defaultChoice))).toEqual([undefined, "d"]);
  expect(ids(resolveComparison([], defaultChoice))).toEqual([undefined, undefined]);
});

test("the member's picks are kept while both are loaded", () => {
  expect(ids(resolveComparison(items, { earlierId: "a", latestId: "b" }))).toEqual(["a", "b"]);
});

test("a deleted pick falls back without putting one check-in in both slots", () => {
  const remaining = items.filter((item) => item.id !== "b");
  expect(ids(resolveComparison(remaining, { earlierId: "a", latestId: "b" }))).toEqual(["a", "d"]);
  expect(ids(resolveComparison(remaining, { earlierId: "d", latestId: "b" }))).toEqual(["c", "d"]);
});

test("with the oldest as latest, a missing earlier pick falls back to the next newer one", () => {
  expect(ids(resolveComparison(items, { earlierId: "gone", latestId: "a" }))).toEqual(["b", "a"]);
});

test("choosing a slot keeps the other one, and choosing the other slot's check-in swaps them", () => {
  const current = resolveComparison(items, defaultChoice);
  expect(chooseSlot(current, "earlier", "a")).toEqual({ earlierId: "a", latestId: "d" });
  expect(chooseSlot(current, "latest", "b")).toEqual({ earlierId: "c", latestId: "b" });
  expect(chooseSlot(current, "earlier", "d")).toEqual({ earlierId: "d", latestId: "c" });
  expect(chooseSlot(current, "latest", "c")).toEqual({ earlierId: "d", latestId: "c" });
});

test("the divider follows the pointer and stays inside the frame", () => {
  const frame = { left: 100, width: 400 };
  expect(dividerPercent(300, frame)).toBe(50);
  expect(dividerPercent(101, frame)).toBe(0);
  expect(dividerPercent(50, frame)).toBe(0);
  expect(dividerPercent(900, frame)).toBe(100);
  expect(dividerPercent(300, { left: 0, width: 0 })).toBe(50);
});
