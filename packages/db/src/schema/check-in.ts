import {
	customType,
	index,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { member } from "./member";

const imageBytes = customType<{ data: Uint8Array; driverData: Uint8Array }>({
	dataType() {
		return "bytea";
	},
});

export const checkIn = pgTable(
	"check_in",
	{
		id: text("id").primaryKey(),
		memberId: text("member_id")
			.notNull()
			.references(() => member.id, { onDelete: "cascade" }),
		imageBytes: imageBytes("image_bytes").notNull(),
		mediaType: text("media_type").notNull(),
		takenAt: timestamp("taken_at").notNull(),
	},
	// History and the reminder read one member's check-ins newest first.
	(table) => [
		index("check_in_member_taken_at_idx").on(
			table.memberId,
			table.takenAt,
			table.id,
		),
	],
);
