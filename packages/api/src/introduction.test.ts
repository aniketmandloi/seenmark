import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import * as memberSchema from "@seenmark/db/schema/member";
import { afterEach, beforeEach, expect, test } from "vitest";

import {
	createMemberCaller,
	createPublicCaller,
	openTestDatabase,
	type TestAuth,
	testPhoto,
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
		imageBase64: testPhoto("aGFpcmxpbmU="),
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
		imageBase64: testPhoto("Ymxha2U="),
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
		imageBase64: testPhoto("Y2FzZXk="),
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
		imageBase64: testPhoto("ZHJldw=="),
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

test("the member can delete their introduction", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Eden Member",
		email: "eden@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Eden Member",
			email: "eden@example.com",
		},
		{ now: () => new Date(FILED_AT) },
	);

	await memberCaller.checkIn.record({
		imageBase64: testPhoto("ZWRlbg=="),
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");
	await memberCaller.introduction.file();
	await memberCaller.introduction.delete();
	expect(await memberCaller.introduction.current()).toBeNull();

	const laterCaller = createMemberCaller(
		db,
		auth,
		{
			userId: opened.id,
			name: "Eden Member",
			email: "eden@example.com",
		},
		{ now: () => new Date("2024-10-01T12:00:00.000Z") },
	);
	expect(await laterCaller.introduction.file()).toEqual({
		memberId: opened.id,
		filedAt: "2024-10-01T12:00:00.000Z",
		recorded: true,
		sent: false,
	});
});

test("another member cannot read the introduction", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const first = await publicCaller.member.openAccount({
		name: "Fran Member",
		email: "fran@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const second = await publicCaller.member.openAccount({
		name: "Glen Member",
		email: "glen@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const firstCaller = createMemberCaller(db, auth, {
		userId: first.id,
		name: "Fran Member",
		email: "fran@example.com",
	});
	const secondCaller = createMemberCaller(db, auth, {
		userId: second.id,
		name: "Glen Member",
		email: "glen@example.com",
	});

	await firstCaller.checkIn.record({
		imageBase64: testPhoto("ZnJhbg=="),
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await firstCaller.score.choose("late");
	await firstCaller.introduction.file();

	expect(await secondCaller.introduction.current()).toBeNull();
	await secondCaller.introduction.delete();
	expect(await firstCaller.introduction.current()).not.toBeNull();
});

test("a signed-out caller and a caller missing an affirmation cannot file", async () => {
	const publicCaller = createPublicCaller(db, auth);
	await expect(publicCaller.introduction.file()).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});

	const underage = await auth.api.signUpEmail({
		body: {
			name: "Harper Member",
			email: "harper@example.com",
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
		name: "Harper Member",
		email: "harper@example.com",
	});
	await expect(underageCaller.introduction.file()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});

test("deleting the account removes the check-in, score, and introduction", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Iris Member",
		email: "iris@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(db, auth, {
		userId: opened.id,
		name: "Iris Member",
		email: "iris@example.com",
	});

	await memberCaller.checkIn.record({
		imageBase64: testPhoto("aXJpcw=="),
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");
	await memberCaller.introduction.file();
	expect(await memberCaller.checkIn.list()).toHaveLength(1);
	expect(await memberCaller.score.current()).toBe("late");
	expect(await memberCaller.introduction.current()).not.toBeNull();

	await memberCaller.member.deleteAccount();

	await expect(memberCaller.checkIn.list()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
	await expect(memberCaller.score.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
	await expect(memberCaller.introduction.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});

	const other = await publicCaller.member.openAccount({
		name: "Jules Member",
		email: "jules@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const otherCaller = createMemberCaller(db, auth, {
		userId: other.id,
		name: "Jules Member",
		email: "jules@example.com",
	});
	expect(await otherCaller.checkIn.list()).toEqual([]);
	expect(await otherCaller.score.current()).toBeNull();
	expect(await otherCaller.introduction.current()).toBeNull();
});

test("two requests filed at once both return the first recorded request", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Kai Member",
		email: "kai@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const caller = (filedAt: string) =>
		createMemberCaller(
			db,
			auth,
			{ userId: opened.id, name: "Kai Member", email: "kai@example.com" },
			{ now: () => new Date(filedAt) },
		);

	await caller(FILED_AT).checkIn.record({
		imageBase64: testPhoto("kai"),
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await caller(FILED_AT).score.choose("late");

	const [first, second] = await Promise.all([
		caller(FILED_AT).introduction.file(),
		caller("2024-09-01T12:00:05.000Z").introduction.file(),
	]);

	expect(first).toEqual(second);
	expect(await caller(FILED_AT).introduction.current()).toEqual(first);
});

test("a request kept after leaving the late band can still be read and deleted", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Lee Member",
		email: "lee@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const memberCaller = createMemberCaller(
		db,
		auth,
		{ userId: opened.id, name: "Lee Member", email: "lee@example.com" },
		{ now: () => new Date(FILED_AT) },
	);

	const recorded = await memberCaller.checkIn.record({
		imageBase64: testPhoto("lee"),
		mediaType: "image/png",
		takenAt: "2024-08-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("late");
	const filed = await memberCaller.introduction.file();

	await memberCaller.checkIn.delete({ id: recorded.id });
	expect(await memberCaller.score.current()).toBeNull();
	expect(await memberCaller.introduction.current()).toEqual(filed);

	await memberCaller.introduction.delete();
	expect(await memberCaller.introduction.current()).toBeNull();
});
