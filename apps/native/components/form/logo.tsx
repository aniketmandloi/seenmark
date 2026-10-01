import { Platform, StyleSheet, Text, View } from "react-native";

import { DISPLAY_FONT } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

/** The web's ring-and-dot mark beside the wordmark. */
export function Logo() {
	const { theme } = useColorScheme();

	return (
		<View accessible accessibilityLabel="Seenmark" style={styles.logo}>
			<View style={[styles.ring, { borderColor: theme.text }]}>
				<View style={[styles.dot, { backgroundColor: theme.text }]} />
			</View>
			<Text style={[styles.wordmark, { color: theme.text }]}>seenmark</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	logo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	ring: {
		width: 20,
		height: 20,
		borderRadius: 10,
		borderWidth: 2.5,
		alignItems: "center",
		justifyContent: "center",
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	// Only the native builds embed the display face; the web fallback would otherwise draw a serif.
	wordmark: Platform.select({
		web: { fontSize: 20, fontWeight: "600" },
		default: { fontSize: 20, fontFamily: DISPLAY_FONT, letterSpacing: -0.5 },
	}),
});
