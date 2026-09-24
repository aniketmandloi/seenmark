import { checkIn } from "@seenmark/db/schema/check-in";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { memberProcedure, router } from "../index";
import {
	isBase64,
	MAX_PHOTO_BASE64_LENGTH,
	PHOTO_MEDIA_TYPES,
	sniffPhotoType,
} from "../photo";

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
				imageBase64: z
					.string()
					.min(1)
					.max(MAX_PHOTO_BASE64_LENGTH, "This photo is too large")
					.refine(isBase64, "This photo could not be read"),
				mediaType: z.enum(PHOTO_MEDIA_TYPES),
				takenAt: z.string().datetime(),
			}),
		)
		.mutation(async ({ input, ctx }) => {
			const imageBytes = decodeBase64(input.imageBase64);
			if (sniffPhotoType(imageBytes) !== input.mediaType) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "This photo is not a JPEG, PNG, or WebP image",
				});
			}

			const id = crypto.randomUUID();
			const takenAt = new Date(input.takenAt);

			await ctx.db.insert(checkIn).values({
				id,
				memberId: ctx.member.id,
				imageBytes,
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
			.select({ id: checkIn.id, takenAt: checkIn.takenAt })
			.from(checkIn)
			.where(eq(checkIn.memberId, ctx.member.id))
			.orderBy(desc(checkIn.takenAt));

		return rows.map((row) => ({
			id: row.id,
			takenAt: row.takenAt.toISOString(),
		}));
	}),

	photo: memberProcedure
		.input(z.object({ id: z.string().min(1) }))
		.query(async ({ input, ctx }) => {
			const [row] = await ctx.db
				.select()
				.from(checkIn)
				.where(
					and(eq(checkIn.id, input.id), eq(checkIn.memberId, ctx.member.id)),
				)
				.limit(1);

			if (!row) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "This check-in is no longer here",
				});
			}

			return {
				id: row.id,
				takenAt: row.takenAt.toISOString(),
				imageBase64: encodeBase64(row.imageBytes),
				mediaType: row.mediaType,
			};
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
			// The check_in_forgets_score trigger clears the score with the last check-in.
			await ctx.db
				.delete(checkIn)
				.where(
					and(eq(checkIn.id, input.id), eq(checkIn.memberId, ctx.member.id)),
				);

			return { ok: true as const };
		}),
});
