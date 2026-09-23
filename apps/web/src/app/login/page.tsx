"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:px-10 lg:py-20">
      <div className="flex flex-col justify-between gap-10 rounded-[2rem] bg-accent/45 p-7 sm:p-10 lg:p-12">
        <div>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl">
            Your hairline, on your terms.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Keep the photos you take, look back when you choose, and decide what feels
            right for you.
          </p>
        </div>

        <ul className="grid gap-4 text-sm leading-6 text-foreground">
          <li className="flex gap-3">
            <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            Your check-ins are visible only to you.
          </li>
          <li className="flex gap-3">
            <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            You choose early, mid, or late for yourself.
          </li>
          <li className="flex gap-3">
            <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
            A photo never decides what comes next.
          </li>
        </ul>
      </div>

      <div className="rounded-[2rem] border border-border/80 bg-card p-6 shadow-[0_22px_72px_-48px_rgba(31,65,49,0.36)] sm:p-10 lg:p-12">
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>
    </section>
  );
}
