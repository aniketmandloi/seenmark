import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import { afterEach, beforeEach, expect, test } from "vitest";

import {
	createMemberCaller,
	createPublicCaller,
	openTestDatabase,
	type TestAuth,
} from "./test-harness";

const FILED_AT = "2024-09-01T12:00:00.000Z";

let client: PGlite;
let db: Database;
let auth: TestAuth;

beforeEach(async () => {
	({ client, db, auth } = await openTestDatabase());
});

afterEach(async () => {
	await client.close();
});

test("filing on the late band stores who asked and when, with no clinic", async () => {
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
		{ now: () => new Date(FILED_AT) },
	);

	await memberCaller.checkIn.record({
		imageBase64: "aGFpcmxpbmU=",
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");

	const filed = await memberCaller.introduction.file();
	expect(filed).toEqual({
		memberId: opened.id,
		filedAt: FILED_AT,
		recorded: true,
		sent: false,
	});
	expect(filed).not.toHaveProperty("clinic");
	expect(filed).not.toHaveProperty("price");
	expect(filed).not.toHaveProperty("photo");

	expect(await memberCaller.introduction.current()).toEqual(filed);
});

test("a second file returns the same request", async () => {
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
		{ now: () => new Date(FILED_AT) },
	);

	await memberCaller.checkIn.record({
		imageBase64: "Ymxha2U=",
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");
	const first = await memberCaller.introduction.file();

	const laterCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Blake Member",
			email: "blake@example.com",
		},
		{ now: () => new Date("2024-10-01T12:00:00.000Z") },
	);
	expect(await laterCaller.introduction.file()).toEqual(first);
	expect(await laterCaller.introduction.current()).toEqual(first);
});

test("filing is rejected when the score is not late", async () => {
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

	await expect(memberCaller.introduction.file()).rejects.toMatchObject({
		code: "BAD_REQUEST",
	});

	await memberCaller.checkIn.record({
		imageBase64: "Y2FzZXk=",
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("early");
	await expect(memberCaller.introduction.file()).rejects.toMatchObject({
		code: "BAD_REQUEST",
	});

	await memberCaller.score.choose("mid");
	await expect(memberCaller.introduction.file()).rejects.toMatchObject({
		code: "BAD_REQUEST",
	});

	expect(await memberCaller.introduction.current()).toBeNull();
});

test("leaving the late band keeps the introduction unsent", async () => {
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
		{ now: () => new Date(FILED_AT) },
	);

	await memberCaller.checkIn.record({
		imageBase64: "ZHJldw==",
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");
	const filed = await memberCaller.introduction.file();

	await memberCaller.score.choose("early");
	expect(await memberCaller.introduction.current()).toEqual(filed);
	expect((await memberCaller.introduction.current())?.sent).toBe(false);

	await memberCaller.score.choose("late");
	expect(await memberCaller.introduction.current()).toEqual(filed);
});
