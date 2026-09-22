import { PGlite } from "@electric-sql/pglite";
import { createAuth } from "@seenmark/auth";
import type { Database } from "@seenmark/db";
import * as authSchema from "@seenmark/db/schema/auth";
import * as memberSchema from "@seenmark/db/schema/member";
import * as todoSchema from "@seenmark/db/schema/todo";
import { pushSchema } from "drizzle-kit/api-postgres";
import { drizzle } from "drizzle-orm/pglite";
import { afterEach, beforeEach, expect, test } from "vitest";

import { appRouter } from "./routers/index";

const schema = { ...authSchema, ...memberSchema, ...todoSchema };
const authEnv = {
	BETTER_AUTH_URL: "http://localhost:3000",
	BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
	CORS_ORIGIN: "http://localhost:3000",
	POLAR_ACCESS_TOKEN: "",
	POLAR_SUCCESS_URL: "http://localhost:3000/success",
};

let client: PGlite;
let db: Database;
let auth: ReturnType<typeof createAuth>;

async function createPublicCaller() {
	return appRouter.createCaller({
		session: null,
		db,
		auth,
	});
}

beforeEach(async () => {
	client = new PGlite();
	db = drizzle({ client });
	const push = await pushSchema(schema, db);
	await push.apply();
	auth = createAuth(authEnv, db);
});

afterEach(async () => {
	await client.close();
});

test("refusing age affirmation leaves no account", async () => {
	const caller = await createPublicCaller();

	await expect(
		caller.member.openAccount({
			name: "Ada Member",
			email: "ada@example.com",
			password: "password123",
			affirmedAtLeast18: false,
			affirmedInUnitedStates: true,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await caller.member.openAccount({
		name: "Ada Member",
		email: "ada@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
});

test("refusing United States affirmation leaves no account", async () => {
	const caller = await createPublicCaller();

	await expect(
		caller.member.openAccount({
			name: "Blake Member",
			email: "blake@example.com",
			password: "password123",
			affirmedAtLeast18: true,
			affirmedInUnitedStates: false,
		}),
	).rejects.toMatchObject({ code: "BAD_REQUEST" });

	await caller.member.openAccount({
		name: "Blake Member",
		email: "blake@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
});

test("stored affirmations are readable through the router with no gender", async () => {
	const publicCaller = await createPublicCaller();
	const opened = await publicCaller.member.openAccount({
		name: "Casey Member",
		email: "casey@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = appRouter.createCaller({
		session: {
			session: {
				id: "session-casey",
				userId: opened.id,
				expiresAt: new Date(Date.now() + 60_000),
				token: "token-casey",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			user: {
				id: opened.id,
				name: "Casey Member",
				email: "casey@example.com",
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		},
		db,
		auth,
	});

	const current = await memberCaller.member.current();
	expect(current).toEqual({
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	expect(current).not.toHaveProperty("gender");
});
