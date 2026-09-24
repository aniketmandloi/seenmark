import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@seenmark/db";
import * as schema from "@seenmark/db/schema/auth";
import { betterAuth } from "better-auth";

export type AuthConfig = {
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	CORS_ORIGIN: string;
};

export function createAuth(
	env: AuthConfig,
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [
			env.CORS_ORIGIN,
			...desktopOrigins,
			"seenmark://",
			"exp://",
			"http://localhost:8081",
		],
		emailAndPassword: { enabled: true },
		// Accounts open only through member.openAccount, which records the
		// affirmations; the raw route would create an account with no member.
		disabledPaths: ["/sign-up/email"],
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [expo()],
	});
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
