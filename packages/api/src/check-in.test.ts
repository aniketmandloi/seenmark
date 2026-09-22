import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import { afterEach, beforeEach, expect, test } from "vitest";
import {
	createMemberCaller,
	createPublicCaller,
	openTestDatabase,
	type TestAuth,
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
		imageBase64: "aGFpcmxpbmU=",
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
		{
			id: recorded.id,
			takenAt: "2024-03-15T10:00:00.000Z",
			imageBase64: "aGFpcmxpbmU=",
		},
	]);
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
		imageBase64: "ZWFybGllcg==",
		takenAt: "2024-03-10T08:00:00.000Z",
	});
	const later = await memberCaller.checkIn.record({
		imageBase64: "bGF0ZXI=",
		takenAt: "2024-03-25T18:30:00.000Z",
	});

	const listed = await memberCaller.checkIn.list();
	expect(listed).toEqual([
		{
			id: later.id,
			takenAt: "2024-03-25T18:30:00.000Z",
			imageBase64: "bGF0ZXI=",
		},
		{
			id: earlier.id,
			takenAt: "2024-03-10T08:00:00.000Z",
			imageBase64: "ZWFybGllcg==",
		},
	]);
});
