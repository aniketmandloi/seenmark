import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MemberScreen from "@/components/member-screen";
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

  return (
    <MemberScreen key={session.user.id} memberId={session.user.id}>
      <Account session={session} />
    </MemberScreen>
  );
}
