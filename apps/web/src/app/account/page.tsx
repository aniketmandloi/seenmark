import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import Account from "./account";

export const metadata: Metadata = {
  title: "Account",
};

export default async function AccountPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <Account key={session.user.id} session={session} />;
}
