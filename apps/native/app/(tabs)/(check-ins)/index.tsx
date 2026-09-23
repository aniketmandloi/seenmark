import { ScrollView, StyleSheet } from "react-native";

import { CheckIns } from "@/components/check-ins";
import { Container } from "@/components/container";

export default function CheckInsScreen() {
	return (
		<Container>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={styles.content}
			>
				<CheckIns />
			</ScrollView>
		</Container>
	);
}

const styles = StyleSheet.create({
	content: {
		padding: 20,
	},
});
