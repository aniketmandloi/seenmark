import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MemberScreen from "@/components/member-screen";
import { authClient } from "@/lib/auth-client";

import NextSteps from "./next-steps";

export const metadata: Metadata = {
  title: "Next steps",
};

export default async function NextStepsPage() {
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
      <NextSteps />
    </MemberScreen>
  );
}
