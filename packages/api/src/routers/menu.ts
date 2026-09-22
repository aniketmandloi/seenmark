import { score } from "@seenmark/db/schema/score";
import { eq } from "drizzle-orm";

import { memberProcedure, router } from "../index";

const EARLY_STEPS = [
	"Take later photos in similar light.",
	"Be gentle with heat and tension.",
	"Treat shedding as something to notice rather than a score.",
] as const;

const MID_STEPS = ["A prescriber is who discusses medicines."] as const;

const LATE_STEPS = [
	"A clinic conversation is you asking to be connected to a clinic.",
	"A verified clinic is a named physician with an unrestricted US license, a price range published before an introduction is sent, and result photos at least 12 months out that are of that physician's patient and are not the clinic's ads.",
	"No clinic is verified in v1, and there is no directory.",
	"Society membership is not the check.",
	"There is no star rating and no guaranteed results.",
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

		if (row.band === "mid") {
			return {
				menu: {
					band: "mid" as const,
					steps: [...MID_STEPS],
				},
			};
		}

		if (row.band === "late") {
			return {
				menu: {
					band: "late" as const,
					steps: [...LATE_STEPS],
				},
			};
		}

		return { menu: null };
	}),
});
