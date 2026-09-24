import { createAuthClient } from "better-auth/react";

import { resolveServerUrl } from "./server-url";

export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", resolveServerUrl(process.env.NEXT_PUBLIC_SERVER_URL!)).toString(),
});
