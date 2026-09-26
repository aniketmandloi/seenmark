import { expect, test } from "vitest";

import { fieldErrorProps } from "./field-error";

test("a valid field is not marked invalid or described by an error", () => {
  expect(fieldErrorProps("email", [])).toEqual({
    "aria-invalid": false,
    "aria-describedby": undefined,
  });
});

test("an invalid field points at the error rendered for it", () => {
  expect(
    fieldErrorProps("affirmedAtLeast18", [{ message: "You must be at least 18 to join" }]),
  ).toEqual({
    "aria-invalid": true,
    "aria-describedby": "affirmedAtLeast18-error",
  });
});
