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

test("with no check-in the score stays clear", async () => {
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

	expect(await memberCaller.score.current()).toBe(null);

	await expect(memberCaller.score.choose("early")).rejects.toMatchObject({
		code: "BAD_REQUEST",
	});

	expect(await memberCaller.score.current()).toBe(null);
});

test("the stored score is the band the member submitted", async () => {
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

	await memberCaller.checkIn.record({
		imageBase64: "aGFpcmxpbmU=",
		mediaType: "image/png",
		takenAt: "2024-03-15T10:00:00.000Z",
	});

	expect(await memberCaller.score.current()).toBe(null);

	await memberCaller.score.choose("mid");
	expect(await memberCaller.score.current()).toBe("mid");

	await memberCaller.score.choose("late");
	expect(await memberCaller.score.current()).toBe("late");
});

test("deleting the last check-in clears the score; deleting an earlier one does not", async () => {
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

	const older = await memberCaller.checkIn.record({
		imageBase64: "b2xkZXI=",
		mediaType: "image/png",
		takenAt: "2024-03-10T08:00:00.000Z",
	});
	const newer = await memberCaller.checkIn.record({
		imageBase64: "bmV3ZXI=",
		mediaType: "image/png",
		takenAt: "2024-03-25T18:30:00.000Z",
	});

	await memberCaller.score.choose("early");
	expect(await memberCaller.score.current()).toBe("early");

	await memberCaller.checkIn.delete({ id: older.id });
	expect(await memberCaller.score.current()).toBe("early");

	await memberCaller.checkIn.delete({ id: newer.id });
	expect(await memberCaller.score.current()).toBe(null);
});
