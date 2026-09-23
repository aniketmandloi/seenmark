import { Stack } from "expo-router";

import { useStackScreenOptions } from "@/lib/native-chrome";

export default function AuthStack() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="welcome"
				options={{ title: "Seenmark", headerLargeTitleEnabled: true }}
			/>
		</Stack>
	);
}
