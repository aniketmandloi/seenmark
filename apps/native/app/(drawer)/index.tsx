import { Column, Text as ExpoText, Host } from "@expo/ui";
import { ScrollView, StyleSheet, View } from "react-native";

import { AuthGate } from "@/components/auth-gate";
import { CheckIns } from "@/components/check-ins";
import { Container } from "@/components/container";
import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function CheckInsScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const { data: session } = authClient.useSession();

	return (
		<Container>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.intro}>
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
									letterSpacing: 1.3,
								}}
							>
								SEENMARK · PRIVATE BY DESIGN
							</ExpoText>
							<ExpoText
								textStyle={{
									color: theme.text,
									fontSize: 30,
									fontWeight: "600",
									lineHeight: 36,
								}}
							>
								Your hairline, over time.
							</ExpoText>
							<ExpoText
								textStyle={{ color: theme.muted, fontSize: 15, lineHeight: 22 }}
							>
								A quiet place to keep your own check-in photos and look back
								when you choose.
							</ExpoText>
						</Column>
					</Host>
				</View>
				{session?.user ? <CheckIns /> : <AuthGate />}
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		paddingTop: 24,
		paddingBottom: 36,
	},
	intro: {
		marginBottom: 24,
	},
});
