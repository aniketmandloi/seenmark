import { neon } from "@neondatabase/serverless";
import type { AnyRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { PgAsyncDatabase } from "drizzle-orm/pg-core/async";

import type { DatabaseConfig } from "./config";
import { relations } from "./relations";

/**
 * Structural database surface shared by Neon (production) and PGlite (tests).
 * Query-result HKT differs per driver; callers only need insert/select/delete.
 */
export type Database = PgAsyncDatabase<PgQueryResultHKT, AnyRelations>;

export function createDb(env: DatabaseConfig): Database {
	const sql = neon(env.DATABASE_URL);
	return drizzle({ client: sql, relations });
}
