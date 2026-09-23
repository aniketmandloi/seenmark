import { checkIn } from "@seenmark/db/schema/check-in";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
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

		const parsed = band.safeParse(row.band);
		if (!parsed.success) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Stored score is not a band",
			});
		}

		return parsed.data;
	}),

	choose: memberProcedure.input(band).mutation(async ({ input, ctx }) => {
		// One statement writes the score only from a check-in that still exists; the
		// share lock makes a concurrent delete of that check-in wait or be seen.
		const [saved] = await ctx.db
			.insert(score)
			.select(
				ctx.db
					.select({
						memberId: checkIn.memberId,
						band: sql<string>`${input}::text`.as("band"),
					})
					.from(checkIn)
					.where(eq(checkIn.memberId, ctx.member.id))
					.limit(1)
					.for("share"),
			)
			.onConflictDoUpdate({
				target: score.memberId,
				set: { band: input },
			})
			.returning({ band: score.band });

		if (!saved) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "A check-in is required before choosing a score",
			});
		}

		return { band: input };
	}),
});
