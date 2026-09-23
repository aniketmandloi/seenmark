import { introduction } from "@seenmark/db/schema/introduction";
import { score } from "@seenmark/db/schema/score";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

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

		const [existing] = await ctx.db
			.select()
			.from(introduction)
			.where(eq(introduction.memberId, ctx.member.id))
			.limit(1);

		if (existing) {
			return toIntroduction(existing.memberId, existing.filedAt);
		}

		const filedAt = ctx.now();
		await ctx.db.insert(introduction).values({
			memberId: ctx.member.id,
			filedAt,
		});

		return toIntroduction(ctx.member.id, filedAt);
	}),

	delete: memberProcedure.mutation(async ({ ctx }) => {
		await ctx.db
			.delete(introduction)
			.where(eq(introduction.memberId, ctx.member.id));
		return { ok: true as const };
	}),
});
