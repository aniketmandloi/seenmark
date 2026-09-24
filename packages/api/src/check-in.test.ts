import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import { checkIn } from "@seenmark/db/schema/check-in";
import * as memberSchema from "@seenmark/db/schema/member";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, expect, test } from "vitest";

import { MAX_PHOTO_BASE64_LENGTH } from "./photo";
import {
	createMemberCaller,
	createPublicCaller,
	openTestDatabase,
	type TestAuth,
	testPhoto,
} from "./test-harness";

let client: PGlite;
let db: Database;
let auth: TestAuth;

beforeEach(async () => {
	({ client, db, auth } = await openTestDatabase());
});

afterEach(async () => {
	await client.close();
});

test("a member can record a check-in and read back that photo and time", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Ada Member",
		email: "ada@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Ada Member",
		email: "ada@example.com",
	});

	const recorded = await memberCaller.checkIn.record({
		imageBase64: testPhoto("aGFpcmxpbmU="),
		mediaType: "image/png",
		takenAt: "2024-03-15T10:00:00.000Z",
	});

	expect(recorded).toEqual({
		id: recorded.id,
		takenAt: "2024-03-15T10:00:00.000Z",
	});
	expect(typeof recorded.id).toBe("string");
	expect(recorded.id.length).toBeGreaterThan(0);

	const listed = await memberCaller.checkIn.list();
	expect(listed).toEqual([
		{ id: recorded.id, takenAt: "2024-03-15T10:00:00.000Z" },
	]);
	expect(await memberCaller.checkIn.photo({ id: recorded.id })).toEqual({
		id: recorded.id,
		takenAt: "2024-03-15T10:00:00.000Z",
		imageBase64: testPhoto("aGFpcmxpbmU="),
		mediaType: "image/png",
	});
});

test("two check-ins in the same month come back newest first", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Blake Member",
		email: "blake@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Blake Member",
		email: "blake@example.com",
	});

	const earlier = await memberCaller.checkIn.record({
		imageBase64: testPhoto("ZWFybGllcg=="),
		mediaType: "image/png",
		takenAt: "2024-03-10T08:00:00.000Z",
	});
	const later = await memberCaller.checkIn.record({
		imageBase64: testPhoto("bGF0ZXI="),
		mediaType: "image/png",
		takenAt: "2024-03-25T18:30:00.000Z",
	});

	const listed = await memberCaller.checkIn.list();
	expect(listed).toEqual([
		{ id: later.id, takenAt: "2024-03-25T18:30:00.000Z" },
		{ id: earlier.id, takenAt: "2024-03-10T08:00:00.000Z" },
	]);
});

test("deleting a check-in removes it from the next list", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Casey Member",
		email: "casey@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Casey Member",
		email: "casey@example.com",
	});

	const keep = await memberCaller.checkIn.record({
		imageBase64: testPhoto("a2VlcA=="),
		mediaType: "image/png",
		takenAt: "2024-04-01T09:00:00.000Z",
	});
	const remove = await memberCaller.checkIn.record({
		imageBase64: testPhoto("cmVtb3Zl"),
		mediaType: "image/png",
		takenAt: "2024-04-02T09:00:00.000Z",
	});

	await memberCaller.checkIn.delete({ id: remove.id });

	const listed = await memberCaller.checkIn.list();
	expect(listed).toEqual([
		{ id: keep.id, takenAt: "2024-04-01T09:00:00.000Z" },
	]);
});

test("a member cannot read another member's check-in or photo", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const first = await publicCaller.member.openAccount({
		name: "Drew Member",
		email: "drew@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const second = await publicCaller.member.openAccount({
		name: "Eden Member",
		email: "eden@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const firstCaller = createMemberCaller(db, auth, {
		userId: first.id,
		name: "Drew Member",
		email: "drew@example.com",
	});
	const secondCaller = createMemberCaller(db, auth, {
		userId: second.id,
		name: "Eden Member",
		email: "eden@example.com",
	});

	const firstCheckIn = await firstCaller.checkIn.record({
		imageBase64: testPhoto("ZHJldw=="),
		mediaType: "image/png",
		takenAt: "2024-05-01T12:00:00.000Z",
	});

	const secondList = await secondCaller.checkIn.list();
	expect(secondList).toEqual([]);

	await secondCaller.checkIn.delete({ id: firstCheckIn.id });

	const firstList = await firstCaller.checkIn.list();
	expect(firstList).toEqual([
		{ id: firstCheckIn.id, takenAt: "2024-05-01T12:00:00.000Z" },
	]);
});

test("a signed-out caller and a caller missing either affirmation cannot record", async () => {
	const publicCaller = createPublicCaller(db, auth);

	await expect(
		publicCaller.checkIn.record({
			imageBase64: testPhoto("aGFpcmxpbmU="),
			mediaType: "image/png",
			takenAt: "2024-06-01T10:00:00.000Z",
		}),
	).rejects.toMatchObject({ code: "UNAUTHORIZED" });

	const underage = await auth.api.signUpEmail({
		body: {
			name: "Fran Member",
			email: "fran@example.com",
			password: "password123",
		},
	});
	await db.insert(memberSchema.member).values({
		id: underage.user.id,
		affirmedAtLeast18: false,
		affirmedInUnitedStates: true,
	});
	const underageCaller = createMemberCaller(db, auth, {
		userId: underage.user.id,
		name: "Fran Member",
		email: "fran@example.com",
	});
	await expect(
		underageCaller.checkIn.record({
			imageBase64: testPhoto("aGFpcmxpbmU="),
			mediaType: "image/png",
			takenAt: "2024-06-01T10:00:00.000Z",
		}),
	).rejects.toMatchObject({ code: "FORBIDDEN" });

	const abroad = await auth.api.signUpEmail({
		body: {
			name: "Glen Member",
			email: "glen@example.com",
			password: "password123",
		},
	});
	await db.insert(memberSchema.member).values({
		id: abroad.user.id,
		affirmedAtLeast18: true,
		affirmedInUnitedStates: false,
	});
	const abroadCaller = createMemberCaller(db, auth, {
		userId: abroad.user.id,
		name: "Glen Member",
		email: "glen@example.com",
	});
	await expect(
		abroadCaller.checkIn.record({
			imageBase64: testPhoto("aGFpcmxpbmU="),
			mediaType: "image/png",
			takenAt: "2024-06-01T10:00:00.000Z",
		}),
	).rejects.toMatchObject({ code: "FORBIDDEN" });
});

test("deleting the account removes that member's check-ins", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Harper Member",
		email: "harper@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Harper Member",
		email: "harper@example.com",
	});

	await memberCaller.checkIn.record({
		imageBase64: testPhoto("aGFycGVy"),
		mediaType: "image/png",
		takenAt: "2024-07-01T10:00:00.000Z",
	});

	await memberCaller.member.deleteAccount();

	await expect(memberCaller.checkIn.list()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});

	const other = await publicCaller.member.openAccount({
		name: "Iris Member",
		email: "iris@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const otherCaller = createMemberCaller(db, auth, {
		userId: other.id,
		name: "Iris Member",
		email: "iris@example.com",
	});
	const otherList = await otherCaller.checkIn.list();
	expect(otherList).toEqual([]);

	const remaining = await db
		.select({ id: checkIn.id })
		.from(checkIn)
		.where(eq(checkIn.memberId, opened.id));
	expect(remaining).toEqual([]);
});

test("a member reads one photo by id, and only their own photo that remains", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const first = await publicCaller.member.openAccount({
		name: "Jules Member",
		email: "jules@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const second = await publicCaller.member.openAccount({
		name: "Kai Member",
		email: "kai@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const firstCaller = createMemberCaller(db, auth, {
		userId: first.id,
		name: "Jules Member",
		email: "jules@example.com",
	});
	const secondCaller = createMemberCaller(db, auth, {
		userId: second.id,
		name: "Kai Member",
		email: "kai@example.com",
	});

	const recorded = await firstCaller.checkIn.record({
		imageBase64: testPhoto("anVsZXM="),
		mediaType: "image/png",
		takenAt: "2024-08-01T10:00:00.000Z",
	});

	expect(await firstCaller.checkIn.photo({ id: recorded.id })).toEqual({
		id: recorded.id,
		takenAt: "2024-08-01T10:00:00.000Z",
		imageBase64: testPhoto("anVsZXM="),
		mediaType: "image/png",
	});

	await expect(
		secondCaller.checkIn.photo({ id: recorded.id }),
	).rejects.toMatchObject({ code: "NOT_FOUND" });

	await firstCaller.checkIn.delete({ id: recorded.id });

	await expect(
		firstCaller.checkIn.photo({ id: recorded.id }),
	).rejects.toMatchObject({ code: "NOT_FOUND" });
});

test("a check-in must be a readable JPEG, PNG, or WebP photo within the size limit", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Lee Member",
		email: "lee@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Lee Member",
		email: "lee@example.com",
	});
	const takenAt = "2024-09-01T10:00:00.000Z";

	await expect(
		memberCaller.checkIn.record({
			imageBase64: "!",
			mediaType: "image/png",
			takenAt,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await expect(
		memberCaller.checkIn.record({
			imageBase64: Buffer.from("not a photo").toString("base64"),
			mediaType: "image/png",
			takenAt,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await expect(
		memberCaller.checkIn.record({
			imageBase64: testPhoto("gif"),
			// @ts-expect-error GIF is not an accepted media type.
			mediaType: "image/gif",
			takenAt,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await expect(
		memberCaller.checkIn.record({
			imageBase64: testPhoto("png"),
			mediaType: "image/jpeg",
			takenAt,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await expect(
		memberCaller.checkIn.record({
			imageBase64: "A".repeat(MAX_PHOTO_BASE64_LENGTH + 4),
			mediaType: "image/png",
			takenAt,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	expect(await memberCaller.checkIn.list()).toEqual([]);
});

test("history and the reminder read through the member and time index", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Max Member",
		email: "max@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Max Member",
		email: "max@example.com",
	});
	await memberCaller.checkIn.record({
		imageBase64: testPhoto("max"),
		mediaType: "image/png",
		takenAt: "2024-09-01T10:00:00.000Z",
	});

	// A handful of rows is cheapest to scan, so rule that out to see whether the
	// index fits these reads at all.
	await client.exec("SET enable_seqscan = off");
	await memberCaller.checkIn.list();
	await memberCaller.checkIn.reminder();
	await client.query("SELECT pg_stat_force_next_flush()");

	const scans = await client.query<{ idx_scan: number }>(
		"SELECT idx_scan FROM pg_stat_user_indexes WHERE indexrelname = 'check_in_member_taken_at_idx'",
	);
	expect(Number(scans.rows[0]?.idx_scan)).toBe(2);
});

test("history comes back in bounded pages, newest first, each check-in once", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Noa Member",
		email: "noa@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Noa Member",
		email: "noa@example.com",
	});

	const takenAts = [
		"2024-01-01T10:00:00.000Z",
		"2024-02-01T10:00:00.000Z",
		"2024-02-01T10:00:00.000Z",
		"2024-03-01T10:00:00.000Z",
		"2024-04-01T10:00:00.000Z",
	];
	for (const [index, takenAt] of takenAts.entries()) {
		await memberCaller.checkIn.record({
			imageBase64: testPhoto(`noa-${index}`),
			mediaType: "image/png",
			takenAt,
		});
	}

	const everything = await memberCaller.checkIn.list();
	expect(everything.map((item) => item.takenAt)).toEqual(
		[...takenAts].reverse(),
	);

	const paged = [];
	let cursor: { takenAt: string; id: string } | null = null;
	for (;;) {
		const page = await memberCaller.checkIn.list({ limit: 2, cursor });
		expect(page.length).toBeLessThanOrEqual(2);
		paged.push(...page);
		const last = page.at(-1);
		if (page.length < 2 || !last) break;
		cursor = last;
	}
	expect(paged).toEqual(everything);

	await expect(memberCaller.checkIn.list({ limit: 101 })).rejects.toMatchObject(
		{
			code: "BAD_REQUEST",
		},
	);
});
