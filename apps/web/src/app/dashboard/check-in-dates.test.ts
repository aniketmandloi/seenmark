import { expect, test } from "vitest";

import { groupByMonth, relativeTime } from "./check-in-dates";

const local = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month, day, hour).toISOString();

test("check-ins group by local month, newest first as given", () => {
  const items = [
    { id: "c", takenAt: local(2026, 5, 20) },
    { id: "b", takenAt: local(2026, 5, 2) },
    { id: "a", takenAt: local(2026, 4, 31) },
    { id: "z", takenAt: local(2025, 5, 15) },
  ];

  expect(
    groupByMonth(items).map((group) => [group.label, group.items.map((item) => item.id)]),
  ).toEqual([
    ["June 2026", ["c", "b"]],
    ["May 2026", ["a"]],
    ["June 2025", ["z"]],
  ]);
});

test("no check-ins make no groups", () => {
  expect(groupByMonth([])).toEqual([]);
});

test("relative time rounds down to the largest whole unit", () => {
  const now = new Date(2026, 5, 30, 12).getTime();
  expect(relativeTime(local(2026, 5, 30, 8), now)).toBe("today");
  expect(relativeTime(local(2026, 5, 29), now)).toBe("1 day ago");
  expect(relativeTime(local(2026, 5, 24), now)).toBe("6 days ago");
  expect(relativeTime(local(2026, 5, 23), now)).toBe("1 week ago");
  expect(relativeTime(local(2026, 5, 9), now)).toBe("3 weeks ago");
  expect(relativeTime(local(2026, 4, 31), now)).toBe("1 month ago");
  expect(relativeTime(local(2025, 5, 30), now)).toBe("1 year ago");
});

test("a check-in stamped slightly in the future reads as today", () => {
  const now = new Date(2026, 5, 30, 12).getTime();
  expect(relativeTime(local(2026, 5, 30, 13), now)).toBe("today");
});
