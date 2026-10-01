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
			<Text
				allowFontScaling={false}
				style={[styles.wordmark, { color: theme.text }]}
			>
				seenmark
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	// A fixed size, like the app icon it replaced, so the native host it sits in needn't measure
	// React Native text to size itself. The wordmark doesn't scale with text size, so it fits.
	logo: {
		width: 140,
		height: 28,
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
