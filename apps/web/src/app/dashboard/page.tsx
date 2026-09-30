import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MemberScreen from "@/components/member-screen";
import { authClient } from "@/lib/auth-client";

import Dashboard from "./dashboard";

export default async function DashboardPage() {
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
      <Dashboard />
    </MemberScreen>
  );
}
