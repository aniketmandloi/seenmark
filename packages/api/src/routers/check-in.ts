import { checkIn } from "@seenmark/db/schema/check-in";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { memberProcedure, router } from "../index";

function imageBytesToBase64(bytes: Buffer | Uint8Array): string {
	return Buffer.from(bytes).toString("base64");
}

export const checkInRouter = router({
	record: memberProcedure
		.input(
			z.object({
				imageBase64: z.string().min(1),
				takenAt: z.string().datetime(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const id = crypto.randomUUID();
			const takenAt = new Date(input.takenAt);

			await ctx.db.insert(checkIn).values({
				id,
				memberId: ctx.member.id,
				imageBytes: Buffer.from(input.imageBase64, "base64"),
				takenAt,
			});

			return {
				id,
				takenAt: takenAt.toISOString(),
			};
		}),

	list: memberProcedure.query(async ({ ctx }) => {
		const rows = await ctx.db
			.select()
			.from(checkIn)
			.where(eq(checkIn.memberId, ctx.member.id))
			.orderBy(desc(checkIn.takenAt));

		return rows.map((row) => ({
			id: row.id,
			takenAt: row.takenAt.toISOString(),
			imageBase64: imageBytesToBase64(row.imageBytes),
		}));
	}),

	delete: memberProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			await ctx.db
				.delete(checkIn)
				.where(
					and(eq(checkIn.id, input.id), eq(checkIn.memberId, ctx.member.id)),
				);
			return { ok: true as const };
		}),
});
