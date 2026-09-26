import { expect, test } from "vitest";

import { dividerPercent } from "./divider-percent";

test("the divider follows the pointer and stays inside the frame", () => {
  const frame = { left: 100, width: 400 };
  expect(dividerPercent(300, frame)).toBe(50);
  expect(dividerPercent(101, frame)).toBe(0);
  expect(dividerPercent(50, frame)).toBe(0);
  expect(dividerPercent(900, frame)).toBe(100);
  expect(dividerPercent(300, { left: 0, width: 0 })).toBe(50);
});
