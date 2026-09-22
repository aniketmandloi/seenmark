import { sql } from "drizzle-orm";
import { check, pgTable, text } from "drizzle-orm/pg-core";

import { member } from "./member";

export const score = pgTable(
	"score",
	{
		memberId: text("member_id")
			.primaryKey()
			.references(() => member.id, { onDelete: "cascade" }),
		band: text("band").notNull(),
	},
	(table) => [
		check(
			"score_band",
			sql`${table.band} in ('early', 'mid', 'late')`,
		),
	],
);
