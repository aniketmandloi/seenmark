import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const signUpWindow = pgTable("sign_up_window", {
	address: text("address").primaryKey(),
	startedAt: timestamp("started_at").notNull(),
	attempts: integer("attempts").notNull(),
});
