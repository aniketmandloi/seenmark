import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import z from "zod";

import { NativeButton } from "@/components/native-button";
import { NativeTextField } from "@/components/native-text-field";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
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

function getErrorMessage(error: unknown): string | null {
	if (!error) return null;
	if (typeof error === "string") return error;
	if (Array.isArray(error)) {
		for (const issue of error) {
			const message = getErrorMessage(issue);
			if (message) return message;
		}
		return null;
	}
	if (typeof error === "object" && error !== null) {
		const maybeError = error as { message?: unknown };
		if (typeof maybeError.message === "string") return maybeError.message;
	}
	return null;
}

function SignIn() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [inputVersion, setInputVersion] = useState(0);

	const form = useForm({
		defaultValues: { email: "", password: "" },
		validators: { onSubmit: signInSchema },
		onSubmit: async ({ value, formApi }) => {
			await authClient.signIn.email(
				{ email: value.email.trim(), password: value.password },
				{
					onError(error) {
						setError(error.error?.message || "Failed to sign in");
					},
					onSuccess() {
						setError(null);
						formApi.reset();
						setInputVersion((version) => version + 1);
						queryClient.refetchQueries();
					},
				},
			);
		},
	});

	return (
		<View style={styles.form}>
			<form.Subscribe
				selector={(state) => ({
					isSubmitting: state.isSubmitting,
					validationError: getErrorMessage(state.errorMap.onSubmit),
				})}
			>
				{({ isSubmitting, validationError }) => {
					const formError = error ?? validationError;
					return (
						<>
							{formError ? (
								<Text style={[styles.errorText, { color: theme.notification }]}>
									{formError}
								</Text>
							) : null}
							<form.Field name="email">
								{(field) => (
									<View style={styles.field}>
										<Text style={[styles.label, { color: theme.text }]}>
											Email
										</Text>
										<NativeTextField
											key={`email-${inputVersion}`}
											defaultValue={field.state.value}
											placeholder="you@example.com"
											keyboardType="email-address"
											autoCapitalize="none"
											onChangeText={(value) => {
												field.handleChange(value);
												if (error) setError(null);
											}}
										/>
									</View>
								)}
							</form.Field>
							<form.Field name="password">
								{(field) => (
									<View style={styles.field}>
										<Text style={[styles.label, { color: theme.text }]}>
											Password
										</Text>
										<NativeTextField
											key={`password-${inputVersion}`}
											defaultValue={field.state.value}
											placeholder="At least 8 characters"
											secureTextEntry
											onSubmitEditing={() => {
												void form.handleSubmit();
											}}
											onChangeText={(value) => {
												field.handleChange(value);
												if (error) setError(null);
											}}
										/>
									</View>
								)}
							</form.Field>
							<NativeButton
								label={isSubmitting ? "Signing in…" : "Sign in"}
								onPress={() => void form.handleSubmit()}
								disabled={isSubmitting}
								style={styles.submit}
							/>
						</>
					);
				}}
			</form.Subscribe>
		</View>
	);
}

const styles = StyleSheet.create({
	form: {
		marginTop: 10,
	},
	field: {
		marginBottom: 2,
	},
	label: {
		fontSize: 13,
		fontWeight: "600",
		marginBottom: 7,
	},
	errorText: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 12,
	},
	submit: {
		alignSelf: "stretch",
		marginTop: 4,
	},
});

export { SignIn };
