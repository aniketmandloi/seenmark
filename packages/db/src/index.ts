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
 * Neon's HTTP driver cannot run interactive transactions, so they are left out:
 * an invariant spanning statements belongs in one statement or in the schema.
 */
export type Database = Omit<
	PgAsyncDatabase<PgQueryResultHKT, AnyRelations>,
	"transaction"
>;

export function createDb(env: DatabaseConfig): Database {
	const sql = neon(env.DATABASE_URL);
	return drizzle({ client: sql, relations });
}
