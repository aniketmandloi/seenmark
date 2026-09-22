import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
	createMemberCaller,
	createPublicCaller,
	openTestDatabase,
	type TestAuth,
} from "./test-harness";

const CLOCK_NOW = new Date("2024-08-01T00:00:00.000Z");

let client: PGlite;
let db: Database;
let auth: TestAuth;

beforeEach(async () => {
	({ client, db, auth } = await openTestDatabase());
});

afterEach(async () => {
	await client.close();
});

test("no check-in means the reminder is not due", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Ada Member",
		email: "ada@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Ada Member",
			email: "ada@example.com",
		},
		() => CLOCK_NOW,
	);

	const reminder = await memberCaller.checkIn.reminder();
	expect(reminder).toEqual({ due: false });
});

test("a check-in taken exactly 30 days ago means the reminder is due", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Blake Member",
		email: "blake@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Blake Member",
			email: "blake@example.com",
		},
		() => CLOCK_NOW,
	);

	await memberCaller.checkIn.record({
		imageBase64: "aGFpcmxpbmU=",
		mediaType: "image/png",
		takenAt: "2024-07-02T00:00:00.000Z",
	});

	const reminder = await memberCaller.checkIn.reminder();
	expect(reminder).toEqual({
		due: true,
		invitation: "Take another photo of your hairline.",
	});
});

test("a check-in taken 29 days ago means the reminder is not due", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Casey Member",
		email: "casey@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Casey Member",
			email: "casey@example.com",
		},
		() => CLOCK_NOW,
	);

	await memberCaller.checkIn.record({
		imageBase64: "aGFpcmxpbmU=",
		mediaType: "image/png",
		takenAt: "2024-07-03T00:00:00.000Z",
	});

	const reminder = await memberCaller.checkIn.reminder();
	expect(reminder).toEqual({ due: false });
});

test("a newer check-in keeps the reminder from being due", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Drew Member",
		email: "drew@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Drew Member",
			email: "drew@example.com",
		},
		() => CLOCK_NOW,
	);

	await memberCaller.checkIn.record({
		imageBase64: "b2xkZXI=",
		mediaType: "image/png",
		takenAt: "2024-06-01T00:00:00.000Z",
	});
	await memberCaller.checkIn.record({
		imageBase64: "bmV3ZXI=",
		mediaType: "image/png",
		takenAt: "2024-07-20T00:00:00.000Z",
	});

	const reminder = await memberCaller.checkIn.reminder();
	expect(reminder).toEqual({ due: false });
});
