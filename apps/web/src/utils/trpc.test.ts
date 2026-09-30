import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// Two full-size photos in one batched response exceed Vercel's 4.5 MB response cap.
test("photo reads go out one per request while other reads still batch", async () => {
  vi.stubEnv("SERVER_URL", "http://server.test");
  const requested: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      requested.push(url);
      const path = new URL(url).pathname.replace("/trpc/", "");
      const results = path.split(",").map(() => ({ result: { data: null } }));
      return Response.json(url.includes("batch=1") ? results : results[0]);
    }),
  );
  const { queryClient, trpc } = await import("./trpc");

  await Promise.all([
    queryClient.fetchQuery(trpc.checkIn.photo.queryOptions({ id: "before" })),
    queryClient.fetchQuery(trpc.checkIn.photo.queryOptions({ id: "after" })),
    queryClient.fetchQuery(trpc.checkIn.list.queryOptions()),
    queryClient.fetchQuery(trpc.checkIn.reminder.queryOptions()),
  ]);

  const paths = requested.map((url) => new URL(url).pathname).sort();
  expect(paths).toEqual([
    "/trpc/checkIn.list,checkIn.reminder",
    "/trpc/checkIn.photo",
    "/trpc/checkIn.photo",
  ]);
});
