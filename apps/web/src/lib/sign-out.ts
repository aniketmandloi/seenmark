import { toast } from "sonner";

import { queryClient } from "@/utils/trpc";

import { authClient } from "./auth-client";
import { forgetMemberData } from "./member-session";

/** Resolves true once the member is signed out; a failure is toasted. */
export async function signOut() {
  const { error } = await authClient.signOut();
  await forgetMemberData(queryClient);
  if (error) {
    toast.error("We could not sign you out. Try again.");
    return false;
  }
  return true;
}
