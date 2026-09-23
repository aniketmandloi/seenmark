import { ScrollView, StyleSheet } from "react-native";

import { AuthGate } from "@/components/auth-gate";
import { Container } from "@/components/container";

export default function WelcomeScreen() {
	return (
		<Container>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
			>
				<AuthGate />
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 20,
	},
});
