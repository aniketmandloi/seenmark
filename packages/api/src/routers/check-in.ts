import { checkIn } from "@seenmark/db/schema/check-in";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { memberProcedure, router } from "../index";
import { clearScoreWhenNoCheckInRemains } from "./score";

function decodeBase64(value: string): Uint8Array {
	const binary = atob(value);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

function encodeBase64(bytes: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i] ?? 0);
	}
	return btoa(binary);
}

export const checkInRouter = router({
	record: memberProcedure
		.input(
			z.object({
				imageBase64: z.string().min(1),
				mediaType: z.string().regex(/^image\//),
				takenAt: z.string().datetime(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const id = crypto.randomUUID();
			const takenAt = new Date(input.takenAt);

			await ctx.db.insert(checkIn).values({
				id,
				memberId: ctx.member.id,
				imageBytes: decodeBase64(input.imageBase64),
				mediaType: input.mediaType,
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
			imageBase64: encodeBase64(row.imageBytes),
			mediaType: row.mediaType,
		}));
	}),

	reminder: memberProcedure.query(async ({ ctx }) => {
		const [newest] = await ctx.db
			.select({ takenAt: checkIn.takenAt })
			.from(checkIn)
			.where(eq(checkIn.memberId, ctx.member.id))
			.orderBy(desc(checkIn.takenAt))
			.limit(1);

		if (!newest) {
			return { due: false as const };
		}

		const threshold = new Date(ctx.now());
		threshold.setUTCDate(threshold.getUTCDate() - 30);

		if (newest.takenAt.getTime() > threshold.getTime()) {
			return { due: false as const };
		}

		return {
			due: true as const,
			invitation: "Take another photo of your hairline." as const,
		};
	}),

	delete: memberProcedure
		.input(z.object({ id: z.string().min(1) }))
		.mutation(async ({ input, ctx }) => {
			await ctx.db
				.delete(checkIn)
				.where(
					and(eq(checkIn.id, input.id), eq(checkIn.memberId, ctx.member.id)),
				);

			await clearScoreWhenNoCheckInRemains(ctx.db, ctx.member.id);

			return { ok: true as const };
		}),
});
