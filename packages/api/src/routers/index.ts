import { protectedProcedure, publicProcedure, router } from "../index";
import { checkInRouter } from "./check-in";
import { introductionRouter } from "./introduction";
import { memberRouter } from "./member";
import { menuRouter } from "./menu";
import { scoreRouter } from "./score";

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
	member: memberRouter,
	checkIn: checkInRouter,
	score: scoreRouter,
	menu: menuRouter,
	introduction: introductionRouter,
});
export type AppRouter = typeof appRouter;
