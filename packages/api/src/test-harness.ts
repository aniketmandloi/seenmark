import { PGlite } from "@electric-sql/pglite";
import { createAuth } from "@seenmark/auth";
import type { Database } from "@seenmark/db";
import * as authSchema from "@seenmark/db/schema/auth";
import * as checkInSchema from "@seenmark/db/schema/check-in";
import * as memberSchema from "@seenmark/db/schema/member";
import * as todoSchema from "@seenmark/db/schema/todo";
import { pushSchema } from "drizzle-kit/api-postgres";
import { drizzle } from "drizzle-orm/pglite";

import { appRouter } from "./routers/index";

const schema = {
	...authSchema,
	...memberSchema,
	...checkInSchema,
	...todoSchema,
};

const authEnv = {
	BETTER_AUTH_URL: "http://localhost:3000",
	BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
	CORS_ORIGIN: "http://localhost:3000",
	POLAR_ACCESS_TOKEN: "",
	POLAR_SUCCESS_URL: "http://localhost:3000/success",
};

export type TestAuth = ReturnType<typeof createAuth>;

export async function openTestDatabase(): Promise<{
	client: PGlite;
	db: Database;
	auth: TestAuth;
}> {
	const client = new PGlite();
	const db = drizzle({ client });
	const push = await pushSchema(schema, db);
	await push.apply();
	const auth = createAuth(authEnv, db);
	return { client, db, auth };
}

export function createPublicCaller(db: Database, auth: TestAuth) {
	return appRouter.createCaller({
		session: null,
		db,
		auth,
	});
}

export function createMemberCaller(
	db: Database,
	auth: TestAuth,
	input: {
		userId: string;
		name: string;
		email: string;
	},
) {
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
