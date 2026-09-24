import { QueryClient } from "@tanstack/react-query";
import { expect, test } from "vitest";

import { forgetMemberData } from "./member-session";

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
