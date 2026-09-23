import { Column, Text as ExpoText, Host } from "@expo/ui";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Container } from "@/components/container";
import { DeleteAccount } from "@/components/delete-account";
import { NativeButton } from "@/components/native-button";
import { PrivacyHeading } from "@/components/privacy-heading";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/trpc";

export default function AccountScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const { data: session } = authClient.useSession();

	if (!session?.user) return null;

	async function signOut() {
		await authClient.signOut();
		queryClient.clear();
		router.replace("/");
	}

	return (
		<Container>
			<ScrollView contentContainerStyle={styles.content}>
				<Host
					colorScheme={colorScheme}
					seedColor={theme.primary}
					matchContents={{ vertical: true }}
				>
					<Column spacing={8}>
						<ExpoText
							textStyle={{
								color: theme.primary,
								fontSize: 11,
								fontWeight: "700",
								letterSpacing: 1.2,
							}}
						>
							YOUR ACCOUNT
						</ExpoText>
						<ExpoText
							textStyle={{ color: theme.text, fontSize: 28, fontWeight: "600" }}
						>
							Your details
						</ExpoText>
					</Column>
				</Host>

				<View
					style={[
						styles.identity,
						{ backgroundColor: theme.card, borderColor: theme.border },
					]}
				>
					<View style={[styles.avatar, { backgroundColor: theme.primary }]}>
						<Text style={[styles.avatarText, { color: theme.background }]}>
							{session.user.name.trim().slice(0, 1).toUpperCase() || "S"}
						</Text>
					</View>
					<View style={styles.identityCopy}>
						<Text style={[styles.name, { color: theme.text }]}>
							{session.user.name}
						</Text>
						<Text style={[styles.email, { color: theme.muted }]}>
							{session.user.email}
						</Text>
					</View>
				</View>

				<View style={styles.privacy}>
					<PrivacyHeading label="Your record stays yours." color={theme.text} />
					<Text style={[styles.body, { color: theme.muted }]}>
						Only you can see your check-in photos. You choose an early, mid, or
						late band; Seenmark does not interpret or diagnose a photo.
					</Text>
				</View>

				<View style={styles.actions}>
					<NativeButton label="Sign out" variant="outlined" onPress={signOut} />
					<DeleteAccount />
				</View>
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	content: {
		paddingHorizontal: 20,
		paddingTop: 28,
		paddingBottom: 40,
	},
	identity: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
		marginTop: 26,
		padding: 18,
		borderWidth: 1,
		borderRadius: 22,
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "600",
	},
	identityCopy: {
		flex: 1,
		gap: 4,
	},
	name: {
		fontSize: 17,
		fontWeight: "600",
	},
	email: {
		fontSize: 14,
	},
	privacy: {
		paddingVertical: 26,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#8A958C55",
	},
	body: {
		fontSize: 15,
		lineHeight: 23,
	},
	actions: {
		gap: 12,
		alignItems: "flex-start",
		paddingTop: 22,
	},
});
