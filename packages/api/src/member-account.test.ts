import type { PGlite } from "@electric-sql/pglite";
import type { Database } from "@seenmark/db";
import * as authSchema from "@seenmark/db/schema/auth";
import * as memberSchema from "@seenmark/db/schema/member";
import { eq } from "drizzle-orm";
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

test("refusing age affirmation leaves no account", async () => {
	const caller = createPublicCaller(db, auth);

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
	const caller = createPublicCaller(db, auth);

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

	const current = await memberCaller.member.current();
	expect(current).toEqual({
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
	expect(current).not.toHaveProperty("gender");
});

test("a signed-out caller is refused by the member-loop gate", async () => {
	const caller = createPublicCaller(db, auth);

	await expect(caller.member.current()).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});
	await expect(caller.member.deleteAccount()).rejects.toMatchObject({
		code: "UNAUTHORIZED",
	});
});

test("a session without a member row is refused by the member-loop gate but can delete itself", async () => {
	const authUser = await auth.api.signUpEmail({
		body: {
			name: "Drew Auth-Only",
			email: "drew@example.com",
			password: "password123",
		},
	});

	const caller = createMemberCaller(db, auth, {
		userId: authUser.user.id,
		name: "Drew Auth-Only",
		email: "drew@example.com",
	});

	await expect(caller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
	expect(await caller.member.deleteAccount()).toEqual({ ok: true });

	const remaining = await db
		.select({ id: authSchema.user.id })
		.from(authSchema.user)
		.where(eq(authSchema.user.id, authUser.user.id));
	expect(remaining).toEqual([]);
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
	const underageCaller = createMemberCaller(db, auth, {
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
	const abroadCaller = createMemberCaller(db, auth, {
		userId: abroad.user.id,
		name: "Glen Member",
		email: "glen@example.com",
	});
	await expect(abroadCaller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});

test("deleting the account removes the member record", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const opened = await publicCaller.member.openAccount({
		name: "Eden Member",
		email: "eden@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	const memberCaller = createMemberCaller(db, auth, {
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

test("an account whose onboarding stopped before the member record is finished by opening it again", async () => {
	const interrupted = await auth.api.signUpEmail({
		body: {
			name: "Harper Member",
			email: "harper@example.com",
			password: "password123",
		},
	});
	const caller = createMemberCaller(db, auth, {
		userId: interrupted.user.id,
		name: "Harper Member",
		email: "harper@example.com",
	});
	await expect(caller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});

	const publicCaller = createPublicCaller(db, auth);
	const reopened = await publicCaller.member.openAccount({
		name: "Harper Member",
		email: "Harper@Example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});

	expect(reopened.id).toBe(interrupted.user.id);
	expect(await caller.member.current()).toEqual({
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	});
});

test("an unfinished account is not finished without its password", async () => {
	const interrupted = await auth.api.signUpEmail({
		body: {
			name: "Iris Member",
			email: "iris@example.com",
			password: "password123",
		},
	});

	const publicCaller = createPublicCaller(db, auth);
	await expect(
		publicCaller.member.openAccount({
			name: "Iris Member",
			email: "iris@example.com",
			password: "not-the-password",
			affirmedAtLeast18: true,
			affirmedInUnitedStates: true,
		}),
	).rejects.toThrow();

	const caller = createMemberCaller(db, auth, {
		userId: interrupted.user.id,
		name: "Iris Member",
		email: "iris@example.com",
	});
	await expect(caller.member.current()).rejects.toMatchObject({
		code: "FORBIDDEN",
	});
});

test("opening an account that is already finished is refused", async () => {
	const publicCaller = createPublicCaller(db, auth);
	const input = {
		name: "Jules Member",
		email: "jules@example.com",
		password: "password123",
		affirmedAtLeast18: true,
		affirmedInUnitedStates: true,
	};
	await publicCaller.member.openAccount(input);

	await expect(publicCaller.member.openAccount(input)).rejects.toThrow();
});
