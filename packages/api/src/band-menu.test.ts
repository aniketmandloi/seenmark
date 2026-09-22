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
