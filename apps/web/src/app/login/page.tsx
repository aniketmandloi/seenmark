import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthLayout from "@/components/auth-layout";
import SignInForm from "@/components/sign-in-form";
import { authClient } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
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
      <SignInForm />
    </AuthLayout>
  );
}
