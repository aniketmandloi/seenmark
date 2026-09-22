import { protectedProcedure, publicProcedure, router } from "../index";
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
});
export type AppRouter = typeof appRouter;
