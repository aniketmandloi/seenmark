import type { Context as ApiContext } from "@seenmark/api/context";
import type { Context as HonoContext } from "hono";

import { auth, db } from "./services";

export type CreateContextOptions = {
	context: HonoContext;
};

export async function createContext({
	context,
}: CreateContextOptions): Promise<ApiContext> {
	const session = await auth.api.getSession({
		headers: context.req.raw.headers,
	});
	return {
		db,
		session,
		auth,
		now: () => new Date(),
		paidLinkDestination: null,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
