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

test("with no score the menu waits", async () => {
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

	expect(await memberCaller.menu.current()).toEqual({ menu: null });
});

test("the early menu is the habits copy, the same for every member", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const first = await publicCaller.member.openAccount({
		name: "Blake Member",
		email: "blake@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	const second = await publicCaller.member.openAccount({
		name: "Casey Member",
		email: "casey@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const firstCaller = createMemberCaller(db, auth, {
		userId: first.id,
		name: "Blake Member",
		email: "blake@example.com",
	});
	const secondCaller = createMemberCaller(db, auth, {
		userId: second.id,
		name: "Casey Member",
		email: "casey@example.com",
	});

	await firstCaller.checkIn.record({
		imageBase64: "Ymxha2U=",
		mediaType: "image/png",
		takenAt: "2024-03-15T10:00:00.000Z",
	});
	await firstCaller.score.choose("early");

	await secondCaller.checkIn.record({
		imageBase64: "Y2FzZXk=",
		mediaType: "image/png",
		takenAt: "2024-03-16T11:00:00.000Z",
	});
	await secondCaller.score.choose("early");

	const earlyMenu = {
		menu: {
			band: "early",
			steps: [
				"Take later photos in similar light.",
				"Be gentle with heat and tension.",
				"Treat shedding as something to notice rather than a score.",
			],
		},
	};

	expect(await firstCaller.menu.current()).toEqual(earlyMenu);
	expect(await secondCaller.menu.current()).toEqual(earlyMenu);
});

test("the early menu includes one Paid link only when a destination is configured", async () => {
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
		"https://example.com/habits",
	);

	await memberCaller.checkIn.record({
		imageBase64: "ZHJldw==",
		mediaType: "image/png",
		takenAt: "2024-05-01T12:00:00.000Z",
	});
	await memberCaller.score.choose("early");

	expect(await memberCaller.score.current()).toBe("early");

	expect(await memberCaller.menu.current()).toEqual({
		menu: {
			band: "early",
			steps: [
				"Take later photos in similar light.",
				"Be gentle with heat and tension.",
				"Treat shedding as something to notice rather than a score.",
			],
			paidLink: {
				label: "Paid link",
				destination: "https://example.com/habits",
			},
		},
	});
});

test("the mid menu has no paid link", async () => {
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
		"https://example.com/habits",
	);

	await memberCaller.checkIn.record({
		imageBase64: "ZWRlbg==",
		mediaType: "image/png",
		takenAt: "2024-06-01T09:00:00.000Z",
	});
	await memberCaller.score.choose("mid");

	expect(await memberCaller.menu.current()).toEqual({
		menu: {
			band: "mid",
			steps: ["A prescriber is who discusses medicines."],
		},
	});
});
