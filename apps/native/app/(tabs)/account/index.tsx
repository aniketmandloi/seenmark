import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";

import {
	FormButton,
	FormConfirmButton,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";
import { authClient } from "@/lib/auth-client";
import { forgetMemberData } from "@/lib/member-session";
import { trpc } from "@/utils/trpc";

export default function AccountScreen() {
	const { data: session } = authClient.useSession();
	const [error, setError] = useState<string | null>(null);
	const deleteAccount = useMutation(
		trpc.member.deleteAccount.mutationOptions(),
	);

	if (!session?.user) return null;

	async function signOut() {
		setError(null);
		const { error: signOutError } = await authClient.signOut();
		await forgetMemberData();
		if (signOutError) setError("Failed to sign out. Try again.");
	}

	async function confirmDelete() {
		setError(null);
		try {
			await deleteAccount.mutateAsync();
			await authClient.signOut().catch(() => undefined);
			await forgetMemberData();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to delete account",
			);
		}
	}

	return (
		<FormScreen>
			<FormSection>
				<FormRow
					icon="account"
					title={session.user.name}
					subtitle={session.user.email}
				/>
			</FormSection>

			<FormSection
				title="Privacy"
				footer="Only you can see your check-in photos. You choose an early, mid, or late band; Seenmark does not interpret or diagnose a photo."
			>
				<FormRow icon="privacy" title="Your record stays yours." />
				<FormRow
					icon="info"
					title="About Seenmark"
					showsChevron
					onPress={() => router.push("/about")}
				/>
			</FormSection>

			{error ? (
				<FormSection>
					<FormRow icon="error" title={error} tone="destructive" />
				</FormSection>
			) : null}

			<FormSection>
				<FormButton
					label="Sign out"
					icon="signOut"
					onPress={() => void signOut()}
				/>
			</FormSection>

			<FormSection footer="Your account and check-in photos will be removed. This cannot be undone.">
				<FormConfirmButton
					label={deleteAccount.isPending ? "Deleting…" : "Delete account"}
					icon="delete"
					title="Delete your account?"
					message="Your account and check-in photos will be removed. This cannot be undone."
					confirmLabel="Delete account"
					cancelLabel="Keep account"
					onConfirm={() => void confirmDelete()}
					disabled={deleteAccount.isPending}
				/>
			</FormSection>
		</FormScreen>
	);
}
