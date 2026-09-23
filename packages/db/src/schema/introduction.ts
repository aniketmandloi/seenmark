import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { member } from "./member";

export const introduction = pgTable("introduction", {
	memberId: text("member_id")
		.primaryKey()
		.references(() => member.id, { onDelete: "cascade" }),
	filedAt: timestamp("filed_at").notNull(),
});
