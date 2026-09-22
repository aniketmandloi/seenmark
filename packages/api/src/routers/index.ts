import { protectedProcedure, publicProcedure, router } from "../index";
import { checkInRouter } from "./check-in";
import { memberRouter } from "./member";
import { todoRouter } from "./todo";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	privateData: protectedProcedure.query(({ ctx }) => {
		return {
			message: "This is private",
			user: ctx.session.user,
		};
	}),
	todo: todoRouter,
	member: memberRouter,
	checkIn: checkInRouter,
});
export type AppRouter = typeof appRouter;
