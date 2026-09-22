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
			const menu: {
				band: "early";
				steps: string[];
				paidLink?: { label: "Paid link"; destination: string };
			} = {
				band: "early",
				steps: [...EARLY_STEPS],
			};

			if (ctx.paidLinkDestination !== null) {
				menu.paidLink = {
					label: "Paid link",
					destination: ctx.paidLinkDestination,
				};
			}

			return { menu };
		}

		return { menu: null };
	}),
});
