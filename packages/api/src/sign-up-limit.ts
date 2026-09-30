import type { Database } from "@seenmark/db";
import { signUpWindow } from "@seenmark/db/schema/sign-up-window";
import { and, lte, ne, sql } from "drizzle-orm";

/**
 * Admission for opening accounts, per client address. Better Auth limits its
 * own sign-up route in its HTTP router, which member.openAccount's direct
 * auth.api call skips, so this applies the same rule: 3 attempts per 10 seconds.
 * The window lives in the database so every server instance shares it; if it
 * can't be read, the error propagates and no account is opened.
 */
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10_000;

export async function admitSignUp(
	db: Database,
	address: string,
	now: Date,
): Promise<boolean> {
	const staleBefore = new Date(now.getTime() - WINDOW_MS);
	await db
		.delete(signUpWindow)
		.where(
			and(
				lte(signUpWindow.startedAt, staleBefore),
				ne(signUpWindow.address, address),
			),
		);

	// One statement, so concurrent attempts from one address each count.
	const stale = sql`${signUpWindow.startedAt} <= ${staleBefore.toISOString()}::timestamp`;
	const [window] = await db
		.insert(signUpWindow)
		.values({ address, startedAt: now, attempts: 1 })
		.onConflictDoUpdate({
			target: signUpWindow.address,
			set: {
				startedAt: sql`case when ${stale} then excluded.started_at else ${signUpWindow.startedAt} end`,
				attempts: sql`case when ${stale} then 1 else ${signUpWindow.attempts} + 1 end`,
			},
		})
		.returning({ attempts: signUpWindow.attempts });
	return window !== undefined && window.attempts <= MAX_ATTEMPTS;
}
