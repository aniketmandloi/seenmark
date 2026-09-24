import { PGlite } from "@electric-sql/pglite";
import { createAuth } from "@seenmark/auth";
import type { Database } from "@seenmark/db";
import { migrationsFolder } from "@seenmark/db/migrations-folder";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import { appRouter } from "./routers/index";

const authEnv = {
	BETTER_AUTH_URL: "http://localhost:3000",
	BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
	CORS_ORIGIN: "http://localhost:3000",
};

export type TestAuth = ReturnType<typeof createAuth>;

export async function openTestDatabase(): Promise<{
	client: PGlite;
	db: Database;
	auth: TestAuth;
}> {
	const client = new PGlite();
	const db = drizzle({ client });
	await migrate(db, { migrationsFolder });
	const auth = createAuth(authEnv, db);
	return { client, db, auth };
}

type CallerOptions = {
	paidLinkDestination?: string | null;
	now?: () => Date;
};

export function createPublicCaller(
	db: Database,
	auth: TestAuth,
	options: CallerOptions = {},
) {
	return appRouter.createCaller({
		session: null,
		db,
		auth,
		paidLinkDestination: options.paidLinkDestination ?? null,
		now: options.now ?? (() => new Date()),
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
	options: CallerOptions = {},
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
		paidLinkDestination: options.paidLinkDestination ?? null,
		now: options.now ?? (() => new Date()),
	});
}
