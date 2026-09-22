import type { createAuth, Session } from "@seenmark/auth";
import type { Database } from "@seenmark/db";

export type Auth = ReturnType<typeof createAuth>;

export type Context = {
	session: Session | null;
	db: Database;
	auth: Auth;
	now: () => Date;
	paidLinkDestination: string | null;
};
