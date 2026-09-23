import { router, Stack } from "expo-router";

import { FormButton, FormEmptyState, FormScreen } from "@/components/form/form";
import { useStackScreenOptions } from "@/lib/native-chrome";

export default function NotFoundScreen() {
	const screenOptions = useStackScreenOptions();

	return (
		<>
			<Stack.Screen
				options={{ ...screenOptions, headerShown: true, title: "Not found" }}
			/>
			<FormScreen>
				<FormEmptyState
					icon="info"
					title="We can’t find that page."
					description="Your check-ins are still right where you left them."
				/>
				<FormButton
					label="Back to check-ins"
					onPress={() => router.replace("/")}
					prominent
				/>
			</FormScreen>
		</>
	);
}
