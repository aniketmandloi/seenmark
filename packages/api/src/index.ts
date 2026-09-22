import { member } from "@seenmark/db/schema/member";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session) {
		throw new TRPCError({
			code: "UNAUTHORIZED",
			message: "Authentication required",
			cause: "No session",
		});
	}
	return next({
		ctx: {
			...ctx,
			session: ctx.session,
		},
	});
});

export const memberProcedure = protectedProcedure.use(async ({ ctx, next }) => {
	const [row] = await ctx.db
		.select()
		.from(member)
		.where(eq(member.id, ctx.session.user.id))
		.limit(1);

	if (!row || !row.affirmedAtLeast18 || !row.affirmedInUnitedStates) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Member affirmations are required",
		});
	}

	return next({
		ctx: {
			...ctx,
			session: ctx.session,
			member: row,
		},
	});
});
