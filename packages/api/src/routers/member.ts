import { member } from "@seenmark/db/schema/member";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { memberProcedure, publicProcedure, router } from "../index";

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

			const result = await ctx.auth.api.signUpEmail({
				body: {
					name: input.name,
					email: input.email,
					password: input.password,
				},
			});

			await ctx.db.insert(member).values({
				id: result.user.id,
				affirmedAtLeast18: true,
				affirmedInUnitedStates: true,
			});

			return {
				id: result.user.id,
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
});
