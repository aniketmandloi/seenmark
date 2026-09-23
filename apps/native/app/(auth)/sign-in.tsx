import { useForm } from "@tanstack/react-form";
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
} from "@/components/form/form";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/form-error";
import { queryClient } from "@/utils/trpc";

const signInSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Email is required")
		.email("Enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Use at least 8 characters"),
});

export default function SignInScreen() {
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: { onSubmit: signInSchema },
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{ email: value.email.trim(), password: value.password },
				{
					onError(error) {
						setError(error.error?.message || "Failed to sign in");
					},
					onSuccess() {
						setError(null);
						queryClient.refetchQueries();
					},
				},
			);
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
				return (
					<FormScreen>
						{formError ? (
							<FormSection>
								<FormRow icon="error" title={formError} tone="destructive" />
							</FormSection>
						) : null}
						<FormFields>
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
										placeholder="Password"
										kind="password"
										submitLabel="go"
										onSubmit={() => void form.handleSubmit()}
										onChangeText={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
						</FormFields>
						<FormButton
							label={isSubmitting ? "Signing in…" : "Sign in"}
							onPress={() => void form.handleSubmit()}
							disabled={isSubmitting}
							prominent
						/>
						<FormSection>
							<FormButton
								label="Create an account instead"
								onPress={() => router.replace("/sign-up")}
							/>
						</FormSection>
					</FormScreen>
				);
			}}
		</form.Subscribe>
	);
}
