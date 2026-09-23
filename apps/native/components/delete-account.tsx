import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";

import { NativeButton } from "@/components/native-button";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient, trpc } from "@/utils/trpc";

function DeleteAccount() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const deleteAccount = useMutation(
		trpc.member.deleteAccount.mutationOptions(),
	);

	async function confirmDelete() {
		setError(null);
		try {
			await deleteAccount.mutateAsync();
			await authClient.signOut();
			queryClient.clear();
			router.replace("/");
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to delete account",
			);
		}
	}

	function askToDelete() {
		Alert.alert(
			"Delete your account?",
			"Your account and check-in photos will be removed. This cannot be undone.",
			[
				{ text: "Keep account", style: "cancel" },
				{
					text: "Delete account",
					style: "destructive",
					onPress: () => void confirmDelete(),
				},
			],
		);
	}

	return (
		<>
			{error ? (
				<Text style={[styles.errorText, { color: theme.notification }]}>
					{error}
				</Text>
			) : null}
			<NativeButton
				label={deleteAccount.isPending ? "Deleting…" : "Delete account"}
				variant="text"
				onPress={askToDelete}
				disabled={deleteAccount.isPending}
			/>
		</>
	);
}

const styles = StyleSheet.create({
	errorText: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 8,
	},
});

export { DeleteAccount };
