import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const member = pgTable("member", {
	id: text("id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	affirmedAtLeast18: boolean("affirmed_at_least_18").notNull(),
	affirmedInUnitedStates: boolean("affirmed_in_united_states").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
