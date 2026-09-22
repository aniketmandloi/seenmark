import { bytea, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { member } from "./member";

export const checkIn = pgTable("check_in", {
	id: text("id").primaryKey(),
	memberId: text("member_id")
		.notNull()
		.references(() => member.id, { onDelete: "cascade" }),
	imageBytes: bytea("image_bytes").notNull(),
	takenAt: timestamp("taken_at").notNull(),
});
