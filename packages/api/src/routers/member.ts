import { account, user } from "@seenmark/db/schema/auth";
import { member } from "@seenmark/db/schema/member";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { Context } from "../context";
import {
	memberProcedure,
	protectedProcedure,
	publicProcedure,
	router,
} from "../index";

/**
 * The auth account is written before the member row, so onboarding can stop
 * between them. Whoever knows that account's password can finish it.
 */
async function findUnfinishedAccount(
	ctx: Context,
	email: string,
	password: string,
): Promise<string | null> {
	const [found] = await ctx.db
		.select({ id: user.id, memberId: member.id, hash: account.password })
		.from(user)
		.leftJoin(member, eq(member.id, user.id))
		.innerJoin(
			account,
			and(eq(account.userId, user.id), eq(account.providerId, "credential")),
		)
		.where(eq(user.email, email.toLowerCase()))
		.limit(1);

	if (!found || found.memberId !== null || !found.hash) {
		return null;
	}

	const authContext = await ctx.auth.$context;
	const matches = await authContext.password.verify({
		hash: found.hash,
		password,
	});
	return matches ? found.id : null;
}

export const memberRouter = router({
	openAccount: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				password: z.string().min(8),
				affirmedAtLeast18: z.boolean(),
				affirmedInUnitedStates: z.boolean(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			if (!input.affirmedAtLeast18 || !input.affirmedInUnitedStates) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Both affirmations are required to open an account",
				});
			}

			let userId: string;
			let resumed = false;
			try {
				const result = await ctx.auth.api.signUpEmail({
					body: {
						name: input.name,
						email: input.email,
						password: input.password,
					},
				});
				userId = result.user.id;
			} catch (cause) {
				const unfinished = await findUnfinishedAccount(
					ctx,
					input.email,
					input.password,
				);
				if (!unfinished) {
					throw cause;
				}
				userId = unfinished;
				resumed = true;
			}

			try {
				await ctx.db
					.insert(member)
					.values({
						id: userId,
						affirmedAtLeast18: true,
						affirmedInUnitedStates: true,
					})
					.onConflictDoNothing();
			} catch (cause) {
				// A resumed account stays in place so it can be finished again.
				if (!resumed) {
					await ctx.db.delete(user).where(eq(user.id, userId));
				}
				throw cause;
			}

			return {
				id: userId,
				affirmedAtLeast18: true as const,
				affirmedInUnitedStates: true as const,
			};
		}),

	current: memberProcedure.query(({ ctx }) => {
		return {
			affirmedAtLeast18: ctx.member.affirmedAtLeast18,
			affirmedInUnitedStates: ctx.member.affirmedInUnitedStates,
		};
	}),

	// Signed in is enough: an account whose onboarding never finished can still be removed.
	deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
		await ctx.db.delete(user).where(eq(user.id, ctx.session.user.id));
		return { ok: true as const };
	}),
});
