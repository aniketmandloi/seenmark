import { Column, Text as ExpoText, Host } from "@expo/ui";
import { router, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Container } from "@/components/container";
import { NativeButton } from "@/components/native-button";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function NotFoundScreen() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<>
			<Stack.Screen options={{ title: "Page not found" }} />
			<Container>
				<View style={styles.container}>
					<Host
						colorScheme={colorScheme}
						seedColor={theme.primary}
						matchContents={{ vertical: true }}
					>
						<Column spacing={12} alignment="center">
							<ExpoText
								textStyle={{
									color: theme.primary,
									fontSize: 11,
									fontWeight: "700",
									letterSpacing: 1.2,
								}}
							>
								SEENMARK
							</ExpoText>
							<ExpoText
								textStyle={{
									color: theme.text,
									fontSize: 25,
									fontWeight: "600",
									textAlign: "center",
								}}
							>
								We can’t find that page.
							</ExpoText>
							<ExpoText
								textStyle={{
									color: theme.muted,
									fontSize: 15,
									textAlign: "center",
									lineHeight: 22,
								}}
							>
								Your check-ins are still right where you left them.
							</ExpoText>
						</Column>
					</Host>
					<NativeButton
						label="Back to check-ins"
						onPress={() => router.replace("/")}
						style={styles.button}
					/>
				</View>
			</Container>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 28,
		gap: 22,
	},
	button: {
		alignSelf: "center",
	},
});
