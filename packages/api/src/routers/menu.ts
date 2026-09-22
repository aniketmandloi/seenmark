import { score } from "@seenmark/db/schema/score";
import { eq } from "drizzle-orm";

import { memberProcedure, router } from "../index";

const EARLY_STEPS = [
	"Take later photos in similar light.",
	"Be gentle with heat and tension.",
	"Treat shedding as something to notice rather than a score.",
] as const;

export const menuRouter = router({
	current: memberProcedure.query(async ({ ctx }) => {
		const [row] = await ctx.db
			.select({ band: score.band })
			.from(score)
			.where(eq(score.memberId, ctx.member.id))
			.limit(1);

		if (!row) {
			return { menu: null };
		}

		if (row.band === "early") {
			return {
				menu: {
					band: "early" as const,
					steps: [...EARLY_STEPS],
				},
			};
		}

		return { menu: null };
	}),
});
