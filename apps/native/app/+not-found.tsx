import { router, Stack } from "expo-router";

import {
	FormButton,
	FormEmptyState,
	FormReveal,
	FormScreen,
} from "@/components/form/form";
import { useStackScreenOptions } from "@/lib/native-chrome";

export default function NotFoundScreen() {
	const screenOptions = useStackScreenOptions();

	return (
		<>
			<Stack.Screen
				options={{ ...screenOptions, headerShown: true, title: "Not found" }}
			/>
			<FormScreen>
				<FormReveal>
					<FormEmptyState
						icon="info"
						title="We can’t find that page."
						description="The link may be old, or the address may have a typo."
					/>
				</FormReveal>
				<FormReveal index={1}>
					<FormButton
						label="Back to check-ins"
						onPress={() => router.replace("/")}
						prominent
					/>
				</FormReveal>
			</FormScreen>
		</>
	);
}
