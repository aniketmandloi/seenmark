import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import * as memberSchema from "@seenmark/db/schema/member";
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

test("another member, a signed-out caller, and a caller missing an affirmation cannot use the score", async () => {
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

	await firstCaller.checkIn.record({
		imageBase64: "ZHJldw==",
		mediaType: "image/png",
		takenAt: "2024-05-01T12:00:00.000Z",
	});
	await firstCaller.score.choose("mid");
	expect(await firstCaller.score.current()).toBe("mid");

	expect(await secondCaller.score.current()).toBe(null);

	await expect(publicCaller.score.choose("early")).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});

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
	await expect(underageCaller.score.choose("early")).rejects.toMatchObject({
		code: "FORBIDDEN",
	});

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
	await expect(abroadCaller.score.choose("early")).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});
