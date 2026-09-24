import { introduction } from "@seenmark/db/schema/introduction";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";

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
		const [band] = await ctx.db
			.select({ band: score.band })
			.from(score)
			.where(eq(score.memberId, ctx.member.id))
			.limit(1);

		if (band?.band !== "late") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "An introduction can be filed only on the late band",
			});
		}

		// The no-op update makes the insert return the first request when one exists,
		// so a retry or a simultaneous file gets the same answer in one statement.
		const [filed] = await ctx.db
			.insert(introduction)
			.values({ memberId: ctx.member.id, filedAt: ctx.now() })
			.onConflictDoUpdate({
				target: introduction.memberId,
				set: { filedAt: sql`${introduction.filedAt}` },
			})
			.returning();

		if (!filed) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "The introduction was not recorded",
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
