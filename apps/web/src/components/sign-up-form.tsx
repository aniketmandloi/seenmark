"use client";

import { Button, buttonVariants } from "@seenmark/ui/components/button";
import { Checkbox } from "@seenmark/ui/components/checkbox";
import { Input } from "@seenmark/ui/components/input";
import { Label } from "@seenmark/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import FieldError from "./field-error";
import Loader from "./loader";
import PasswordInput from "./password-input";

export default function SignUpForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const openAccount = useMutation(trpc.member.openAccount.mutationOptions());

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      affirmedAtLeast18: false,
      affirmedInUnitedStates: false,
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);

      try {
        await openAccount.mutateAsync({
          name: value.name.trim(),
          email: value.email.trim(),
          password: value.password,
          affirmedAtLeast18: value.affirmedAtLeast18,
          affirmedInUnitedStates: value.affirmedInUnitedStates,
        });
      } catch (cause) {
        setErrorMessage(
          cause instanceof Error ? cause.message : "We could not create your account.",
        );
        return;
      }

      const signedIn = await authClient.signIn.email({
        email: value.email.trim(),
        password: value.password,
      });

      if (signedIn.error) {
        setErrorMessage("Your account is ready. Sign in below to continue.");
        return;
      }

      router.push("/dashboard");
      toast.success("Your account is ready");
    },
    validators: {
      onSubmit: z.object({
        name: z.string().trim().min(2, "Enter at least 2 characters"),
        email: z.email("Enter a valid email address"),
        password: z.string().min(8, "Use at least 8 characters"),
        affirmedAtLeast18: z.boolean().refine((value) => value, "You must be at least 18 to join"),
        affirmedInUnitedStates: z
          .boolean()
          .refine((value) => value, "Seenmark is currently for US adults"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-semibold text-2xl tracking-[-0.04em]">Create your account</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-6">
          Your check-ins stay private to you.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {errorMessage ? (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-4 py-3 text-destructive text-sm"
          >
            {errorMessage}
          </p>
        ) : null}

        <form.Field name="name">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name} className="font-medium text-sm">
                Name
              </Label>
              <Input
                id={field.name}
                name={field.name}
                autoComplete="name"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

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
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <FieldError errors={field.state.meta.errors} />
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
                autoComplete="new-password"
                required
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
              />
              <p className="text-muted-foreground text-xs">At least 8 characters.</p>
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <div className="space-y-3 border-border/70 border-t pt-4">
          <form.Field name="affirmedAtLeast18">
            {(field) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Label
                  htmlFor={field.name}
                  className="cursor-pointer text-muted-foreground text-sm leading-5"
                >
                  I confirm that I am 18 or older.
                </Label>
              </div>
            )}
          </form.Field>

          <form.Field name="affirmedInUnitedStates">
            {(field) => (
              <div className="flex items-start gap-3">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => field.handleChange(checked === true)}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                <Label
                  htmlFor={field.name}
                  className="cursor-pointer text-muted-foreground text-sm leading-5"
                >
                  I confirm that I live in the United States.
                </Label>
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating your account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 border-border/70 border-t pt-5 text-center">
        <p className="text-muted-foreground text-sm">Already have an account?</p>
        <Link
          href="/login"
          className={buttonVariants({
            variant: "link",
            className: "mt-1 h-auto px-2 py-1 font-semibold",
          })}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
