import { Column, Text as ExpoText, Host } from "@expo/ui";
import { router, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Container } from "@/components/container";
import { NativeButton } from "@/components/native-button";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function AboutSeenmark() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<>
			<Stack.Screen options={{ title: "About Seenmark" }} />
			<Container>
				<View style={styles.content}>
					<Host
						colorScheme={colorScheme}
						seedColor={theme.primary}
						matchContents={{ vertical: true }}
					>
						<Column spacing={12}>
							<ExpoText
								textStyle={{
									color: theme.primary,
									fontSize: 11,
									fontWeight: "700",
									letterSpacing: 1.2,
								}}
							>
								ABOUT YOUR RECORD
							</ExpoText>
							<ExpoText
								textStyle={{
									color: theme.text,
									fontSize: 25,
									fontWeight: "600",
									lineHeight: 31,
								}}
							>
								Your photos are yours.
							</ExpoText>
							<ExpoText
								textStyle={{ color: theme.muted, fontSize: 15, lineHeight: 23 }}
							>
								Seenmark keeps your check-in photos private to your account. You
								choose how to describe what you see, and we do not interpret or
								diagnose a photo.
							</ExpoText>
						</Column>
					</Host>
					<NativeButton
						label="Close"
						variant="outlined"
						onPress={() => router.back()}
						style={styles.button}
					/>
				</View>
			</Container>
		</>
	);
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		padding: 24,
		justifyContent: "center",
	},
	button: {
		alignSelf: "flex-start",
		marginTop: 24,
	},
});
