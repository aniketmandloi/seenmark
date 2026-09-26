import type { Metadata } from "next";

import AuthLayout from "@/components/auth-layout";
import SignUpForm from "@/components/sign-up-form";

export const metadata: Metadata = {
  title: "Create your account",
};

export default function SignUpPage() {
  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
