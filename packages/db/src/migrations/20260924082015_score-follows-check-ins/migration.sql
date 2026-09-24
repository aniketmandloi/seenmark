-- A score needs a check-in, so deleting a member's last check-in deletes the score.
-- Each delete first locks its member row: two deletes for one member then run one
-- after the other, and the later one's check reads a snapshot taken after the
-- earlier one committed. Without the lock, each could still see the other's row.
CREATE FUNCTION "forget_score_without_check_in"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
	PERFORM 1 FROM "member" WHERE "id" = OLD."member_id" FOR NO KEY UPDATE;
	DELETE FROM "score"
	WHERE "member_id" = OLD."member_id"
		AND NOT EXISTS (
			SELECT 1 FROM "check_in" WHERE "member_id" = OLD."member_id"
		);
	RETURN NULL;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "check_in_forgets_score"
AFTER DELETE ON "check_in"
FOR EACH ROW EXECUTE FUNCTION "forget_score_without_check_in"();
