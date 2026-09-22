import { checkIn } from "@seenmark/db/schema/check-in";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { memberProcedure, router } from "../index";

const band = z.enum(["early", "mid", "late"]);

export const scoreRouter = router({
	current: memberProcedure.query(async ({ ctx }) => {
		const [row] = await ctx.db
			.select({ band: score.band })
			.from(score)
			.where(eq(score.memberId, ctx.member.id))
			.limit(1);

		if (!row) {
			return null;
		}

		return row.band as z.infer<typeof band>;
	}),

	choose: memberProcedure.input(band).mutation(async ({ input, ctx }) => {
		const [existing] = await ctx.db
			.select({ id: checkIn.id })
			.from(checkIn)
			.where(eq(checkIn.memberId, ctx.member.id))
			.limit(1);

		if (!existing) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "A check-in is required before choosing a score",
			});
		}

		await ctx.db
			.insert(score)
			.values({
				memberId: ctx.member.id,
				band: input,
			})
			.onConflictDoUpdate({
				target: score.memberId,
				set: { band: input },
			});

		return { band: input };
	}),
});
