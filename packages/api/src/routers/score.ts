import type { Database } from "@seenmark/db";
import { checkIn } from "@seenmark/db/schema/check-in";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { memberProcedure, router } from "../index";

export async function clearScoreWhenNoCheckInRemains(
	db: Database,
	memberId: string,
) {
	const [remaining] = await db
		.select({ id: checkIn.id })
		.from(checkIn)
		.where(eq(checkIn.memberId, memberId))
		.limit(1);

	if (!remaining) {
		await db.delete(score).where(eq(score.memberId, memberId));
	}
}

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
