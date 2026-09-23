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
