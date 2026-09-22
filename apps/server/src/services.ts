import { createAuth } from "@seenmark/auth";
import { createDb } from "@seenmark/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
