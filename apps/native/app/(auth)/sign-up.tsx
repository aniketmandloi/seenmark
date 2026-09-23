import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import z from "zod";

import {
	FormButton,
	FormFields,
	FormRow,
	FormScreen,
	FormSection,
	FormTextField,
	FormToggle,
} from "@/components/form/form";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/form-error";
import { queryClient, trpc } from "@/utils/trpc";

const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Name is required")
		.min(2, "Name must be at least 2 characters"),
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
	affirmedAtLeast18: z.boolean(),
	affirmedInUnitedStates: z.boolean(),
});

export default function SignUpScreen() {
	const [error, setError] = useState<string | null>(null);
	const openAccount = useMutation(trpc.member.openAccount.mutationOptions());

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			affirmedAtLeast18: false,
			affirmedInUnitedStates: false,
		},
		validators: { onSubmit: signUpSchema },
		onSubmit: async ({ value }) => {
			if (!value.affirmedAtLeast18 || !value.affirmedInUnitedStates) {
				setError("Confirm both statements to create an account.");
				return;
			}

			try {
				await openAccount.mutateAsync({
					name: value.name.trim(),
					email: value.email.trim(),
					password: value.password,
					affirmedAtLeast18: true,
					affirmedInUnitedStates: true,
				});
				const signedIn = await authClient.signIn.email({
					email: value.email.trim(),
					password: value.password,
				});
				if (signedIn.error) {
					setError(
						signedIn.error.message ||
							"Account created. Please sign in to continue.",
					);
					return;
				}
				setError(null);
				await queryClient.refetchQueries();
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Failed to open account",
				);
			}
		},
	});

	return (
		<form.Subscribe
			selector={(state) => ({
				isSubmitting: state.isSubmitting,
				validationError: getErrorMessage(state.errorMap.onSubmit),
			})}
		>
			{({ isSubmitting, validationError }) => {
				const formError = error ?? validationError;
				const isBusy = isSubmitting || openAccount.isPending;
				return (
					<FormScreen>
						{formError ? (
							<FormSection>
								<FormRow icon="error" title={formError} tone="destructive" />
							</FormSection>
						) : null}
						<FormFields title="Your details">
							<form.Field name="name">
								{(field) => (
									<FormTextField
										placeholder="Name"
										kind="name"
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
							<form.Field name="email">
								{(field) => (
									<FormTextField
										placeholder="Email"
										kind="email"
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
							<form.Field name="password">
								{(field) => (
									<FormTextField
										placeholder="Password (at least 8 characters)"
										kind="newPassword"
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
						</FormFields>
						<FormFields
							title="Confirm"
							footer="Seenmark is for adults in the United States. It does not diagnose or interpret photos."
						>
							<form.Field name="affirmedAtLeast18">
								{(field) => (
									<FormToggle
										label="I am 18 or older"
										value={field.state.value}
										onValueChange={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
							<form.Field name="affirmedInUnitedStates">
								{(field) => (
									<FormToggle
										label="I am in the United States"
										value={field.state.value}
										onValueChange={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
						</FormFields>
						<FormButton
							label={isBusy ? "Creating account…" : "Create account"}
							onPress={() => void form.handleSubmit()}
							disabled={isBusy}
							prominent
						/>
						<FormSection>
							<FormButton
								label="I already have an account"
								onPress={() => router.replace("/sign-in")}
							/>
						</FormSection>
					</FormScreen>
				);
			}}
		</form.Subscribe>
	);
}
