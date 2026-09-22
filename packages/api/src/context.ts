import type { Session } from "@seenmark/auth";
import type { Database } from "@seenmark/db";

export type Context = {
  session: Session | null;
  db: Database;
};
