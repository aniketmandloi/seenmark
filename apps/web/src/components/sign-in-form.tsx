"use client";

import { Alert, AlertDescription } from "@seenmark/ui/components/alert";
import { Button, buttonVariants } from "@seenmark/ui/components/button";
import { Input } from "@seenmark/ui/components/input";
import { Label } from "@seenmark/ui/components/label";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import AuthFormSkeleton from "./auth-form-skeleton";
import FieldError, { fieldErrorProps } from "./field-error";
import PasswordInput from "./password-input";

export default function SignInForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      await authClient.signIn.email(
        {
          email: value.email.trim(),
          password: value.password,
        },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success("Welcome back");
          },
          onError: (error) => {
            setErrorMessage(
              error.error.message || error.error.statusText || "We could not sign you in.",
            );
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Enter a valid email address"),
        password: z.string().min(8, "Use at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <AuthFormSkeleton fields={["email", "password"]} />;
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display text-heading">Welcome back</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Sign in to see your private check-ins.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-5"
      >
        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="font-medium text-sm">
                Email
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  setErrorMessage(null);
                }}
                {...fieldErrorProps(field.name, field.state.meta.errors)}
              />
              <FieldError name={field.name} errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="font-medium text-sm">
                Password
              </Label>
              <PasswordInput
                id={field.name}
                name={field.name}
                autoComplete="current-password"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                  setErrorMessage(null);
                }}
                {...fieldErrorProps(field.name, field.state.meta.errors)}
              />
              <FieldError name={field.name} errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 border-border/70 border-t pt-5 text-center">
        <p className="text-muted-foreground text-sm">New to Seenmark?</p>
        <Link
          href="/signup"
          className={buttonVariants({
            variant: "link",
            className: "mt-1 h-auto px-2 py-1 font-semibold",
          })}
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
