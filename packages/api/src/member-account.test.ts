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

function createMemberCaller(input: {
	userId: string;
	name: string;
	email: string;
}) {
	return appRouter.createCaller({
		session: {
			session: {
				id: `session-${input.userId}`,
				userId: input.userId,
				expiresAt: new Date(Date.now() + 60_000),
				token: `token-${input.userId}`,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			user: {
				id: input.userId,
				name: input.name,
				email: input.email,
				emailVerified: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		},
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

	const memberCaller = createMemberCaller({
		userId: opened.id,
		name: "Casey Member",
		email: "casey@example.com",
	});

	const current = await memberCaller.member.current();
	expect(current).toEqual({
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	expect(current).not.toHaveProperty("gender");
});

test("a signed-out caller is refused by the member-loop gate", async () => {
	const caller = await createPublicCaller();

	await expect(caller.member.current()).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});
	await expect(caller.member.deleteAccount()).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});
});

test("a session without a member row is refused by the member-loop gate", async () => {
	const authUser = await auth.api.signUpEmail({
		body: {
			name: "Drew Auth-Only",
			email: "drew@example.com",
			password: "password123",
		},
	});

	const caller = createMemberCaller({
		userId: authUser.user.id,
		name: "Drew Auth-Only",
		email: "drew@example.com",
	});

	await expect(caller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
	await expect(caller.member.deleteAccount()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});

test("a caller missing either affirmation is refused", async () => {
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
	const underageCaller = createMemberCaller({
		userId: underage.user.id,
		name: "Fran Member",
		email: "fran@example.com",
	});
	await expect(underageCaller.member.current()).rejects.toMatchObject({
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
	const abroadCaller = createMemberCaller({
		userId: abroad.user.id,
		name: "Glen Member",
		email: "glen@example.com",
	});
	await expect(abroadCaller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});

test("deleting the account removes the member record", async () => {
	const publicCaller = await createPublicCaller();
	const opened = await publicCaller.member.openAccount({
		name: "Eden Member",
		email: "eden@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller({
		userId: opened.id,
		name: "Eden Member",
		email: "eden@example.com",
	});

	await memberCaller.member.deleteAccount();

	await expect(memberCaller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});

	await publicCaller.member.openAccount({
		name: "Eden Member",
		email: "eden@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
});
