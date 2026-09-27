import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";

import {
	FormButton,
	FormConfirmButton,
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";
import { authClient } from "@/lib/auth-client";
import { announce, confirmDeleted, notifyResult } from "@/lib/feedback";
import { forgetMemberData } from "@/lib/member-session";
import { trpc } from "@/utils/trpc";

export default function AccountScreen() {
	const { data: session } = authClient.useSession();
	// Kept once the session ends, so the screen still shows the member while the stack fades out.
	const [member, setMember] = useState(session?.user);
	if (session?.user && session.user !== member) setMember(session.user);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState<"signOut" | "delete" | null>(null);
	const deleteAccount = useMutation(
		trpc.member.deleteAccount.mutationOptions(),
	);

	if (!member) return null;

	function fail(message: string) {
		setPending(null);
		setError(message);
		announce(message);
	}

	// On success the session ends and this stack fades out, so pending stays until it is gone.
	async function signOut() {
		setError(null);
		setPending("signOut");
		const signedOut = await authClient.signOut().then(
			({ error: signOutError }) => !signOutError,
			() => false,
		);
		await forgetMemberData();
		if (!signedOut) fail("Failed to sign out. Try again.");
	}

	async function confirmDelete() {
		setError(null);
		setPending("delete");
		try {
			await deleteAccount.mutateAsync();
			confirmDeleted();
			notifyResult("Account deleted");
			await authClient.signOut().catch(() => undefined);
			await forgetMemberData();
		} catch (cause) {
			fail(cause instanceof Error ? cause.message : "Failed to delete account");
		}
	}

	return (
		<FormScreen>
			<FormReveal index={0}>
				<FormSection>
					<FormRow icon="account" title={member.name} subtitle={member.email} />
				</FormSection>
			</FormReveal>

			<FormReveal index={1}>
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
			</FormReveal>

			{error ? (
				<FormReveal key={error}>
					<FormSection>
						<FormRow icon="error" title={error} tone="destructive" />
					</FormSection>
				</FormReveal>
			) : null}

			<FormReveal index={2}>
				<FormSection>
					<FormButton
						label={pending === "signOut" ? "Signing out…" : "Sign out"}
						icon="signOut"
						onPress={() => void signOut()}
						disabled={pending === "delete"}
						pending={pending === "signOut"}
					/>
				</FormSection>
			</FormReveal>

			<FormReveal index={3}>
				<FormSection footer="Your account and check-in photos will be removed. This cannot be undone.">
					<FormConfirmButton
						label={pending === "delete" ? "Deleting…" : "Delete account"}
						icon="delete"
						title="Delete your account?"
						message="Your account and check-in photos will be removed. This cannot be undone."
						confirmLabel="Delete account"
						cancelLabel="Keep account"
						onConfirm={() => void confirmDelete()}
						disabled={pending === "signOut"}
						pending={pending === "delete"}
					/>
				</FormSection>
			</FormReveal>
		</FormScreen>
	);
}
