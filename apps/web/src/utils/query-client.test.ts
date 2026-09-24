import { QueryObserver } from "@tanstack/react-query";
import { expect, test } from "vitest";

import { createQueryClient } from "./query-client";

test("retrying a failed read sends it again and shows the recovered data", async () => {
  const retries: (() => void)[] = [];
  const queryClient = createQueryClient((_message, retry) => retries.push(retry));

  let requests = 0;
  const observer = new QueryObserver(queryClient, {
    queryKey: ["checkIn", "list"],
    queryFn: async () => {
      requests += 1;
      if (requests === 1) throw new Error("offline");
      return ["check-in"];
    },
    retry: false,
  });
  const results: unknown[] = [];
  const unsubscribe = observer.subscribe((result) => results.push(result.data));

  await expect.poll(() => retries.length).toBe(1);
  retries[0]?.();

  await expect.poll(() => requests).toBe(2);
  await expect.poll(() => observer.getCurrentResult().data).toEqual(["check-in"]);
  unsubscribe();
});
