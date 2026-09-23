import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import z from "zod";

import { NativeButton } from "@/components/native-button";
import { NativeCheckbox } from "@/components/native-checkbox";
import { NativeTextField } from "@/components/native-text-field";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
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

function SignUp() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [inputVersion, setInputVersion] = useState(0);
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
		onSubmit: async ({ value, formApi }) => {
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
				formApi.reset();
				setInputVersion((version) => version + 1);
				await queryClient.refetchQueries();
			} catch (cause) {
				setError(
					cause instanceof Error ? cause.message : "Failed to open account",
				);
			}
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
							<form.Field name="name">
								{(field) => (
									<View style={styles.field}>
										<Text style={[styles.label, { color: theme.text }]}>
											Name
										</Text>
										<NativeTextField
											key={`name-${inputVersion}`}
											defaultValue={field.state.value}
											placeholder="Your name"
											autoCapitalize="words"
											onChangeText={(value) => {
												field.handleChange(value);
												if (error) setError(null);
											}}
										/>
									</View>
								)}
							</form.Field>
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
							<form.Field name="affirmedAtLeast18">
								{(field) => (
									<NativeCheckbox
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
									<NativeCheckbox
										label="I am in the United States"
										value={field.state.value}
										onValueChange={(value) => {
											field.handleChange(value);
											if (error) setError(null);
										}}
									/>
								)}
							</form.Field>
							<NativeButton
								label={
									isSubmitting || openAccount.isPending
										? "Creating account…"
										: "Create account"
								}
								onPress={() => void form.handleSubmit()}
								disabled={isSubmitting || openAccount.isPending}
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
		marginTop: 14,
	},
});

export { SignUp };
