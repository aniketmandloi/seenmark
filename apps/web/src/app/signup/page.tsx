import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthLayout from "@/components/auth-layout";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function SignUpPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
