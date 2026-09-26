import { queryClient, trpc } from "@/utils/trpc";

export async function invalidateMemberLoop() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: trpc.checkIn.list.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.score.current.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.menu.current.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.checkIn.reminder.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.introduction.current.queryKey() }),
  ]);
}
