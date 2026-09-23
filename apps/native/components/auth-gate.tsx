import { SegmentedControl } from "@expo/ui/community/segmented-control";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { SignIn } from "@/components/sign-in";
import { SignUp } from "@/components/sign-up";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export function AuthGate() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

	return (
		<View
			style={[
				styles.panel,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.eyebrow, { color: theme.primary }]}>
				A PRIVATE PHOTO JOURNAL
			</Text>
			<Text style={[styles.title, { color: theme.text }]}>
				Start with one photo.
			</Text>
			<Text style={[styles.description, { color: theme.muted }]}>
				Check in over time, choose the description that feels right, and keep
				your record to yourself.
			</Text>
			<SegmentedControl
				values={["Sign in", "Create account"]}
				selectedIndex={mode === "sign-in" ? 0 : 1}
				appearance={colorScheme}
				tintColor={theme.primary}
				style={styles.switcher}
				onValueChange={(value) =>
					setMode(value === "Create account" ? "sign-up" : "sign-in")
				}
			/>
			{mode === "sign-in" ? <SignIn /> : <SignUp />}
			<Text style={[styles.footnote, { color: theme.muted }]}>
				For adults in the United States. Seenmark does not diagnose or interpret
				photos.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	panel: {
		padding: 20,
		borderWidth: 1,
		borderRadius: 24,
	},
	eyebrow: {
		fontSize: 11,
		letterSpacing: 1.2,
		fontWeight: "700",
		marginBottom: 10,
	},
	title: {
		fontSize: 24,
		lineHeight: 30,
		fontWeight: "600",
	},
	description: {
		fontSize: 15,
		lineHeight: 23,
		marginTop: 8,
	},
	switcher: {
		width: "100%",
		marginTop: 22,
		marginBottom: 8,
	},
	footnote: {
		fontSize: 12,
		lineHeight: 18,
		marginTop: 16,
	},
});
