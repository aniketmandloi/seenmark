import type { createAuth, Session } from "@seenmark/auth";
import type { Database } from "@seenmark/db";

import type { SignUpLimit } from "./sign-up-limit";

export type Auth = ReturnType<typeof createAuth>;

export type Context = {
	session: Session | null;
	db: Database;
	auth: Auth;
	now: () => Date;
	paidLinkDestination: string | null;
	clientAddress: string | null;
	signUpLimit: SignUpLimit;
};
