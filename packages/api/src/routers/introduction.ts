import { introduction } from "@seenmark/db/schema/introduction";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

import { memberProcedure, router } from "../index";

function toIntroduction(memberId: string, filedAt: Date) {
	return {
		memberId,
		filedAt: filedAt.toISOString(),
		recorded: true as const,
		sent: false as const,
	};
}

export const introductionRouter = router({
	current: memberProcedure.query(async ({ ctx }) => {
		const [row] = await ctx.db
			.select()
			.from(introduction)
			.where(eq(introduction.memberId, ctx.member.id))
			.limit(1);

		if (!row) {
			return null;
		}

		return toIntroduction(row.memberId, row.filedAt);
	}),

	file: memberProcedure.mutation(async ({ ctx }) => {
		// One statement files only from a late score, so a band change cannot slip in
		// between the check and the write. The no-op update makes the insert return
		// the first request when one exists, so a retry gets the same answer.
		const [filed] = await ctx.db
			.insert(introduction)
			.select(
				ctx.db
					.select({
						memberId: score.memberId,
						filedAt: sql<Date>`${ctx.now().toISOString()}::timestamp`.as(
							"filed_at",
						),
					})
					.from(score)
					.where(
						and(eq(score.memberId, ctx.member.id), eq(score.band, "late")),
					),
			)
			.onConflictDoUpdate({
				target: introduction.memberId,
				set: { filedAt: sql`${introduction.filedAt}` },
			})
			.returning();

		if (!filed) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "An introduction can be filed only on the late band",
			});
		}

		return toIntroduction(filed.memberId, filed.filedAt);
	}),

	delete: memberProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.delete(introduction)
			.where(eq(introduction.memberId, ctx.member.id));
		return { ok: true as const };
	}),
});
