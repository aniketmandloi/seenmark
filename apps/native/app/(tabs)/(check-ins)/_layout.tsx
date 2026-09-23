import { Stack } from "expo-router";

import { useStackScreenOptions } from "@/lib/native-chrome";

export default function CheckInsStack() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="index"
				options={{ title: "Check-ins", headerLargeTitleEnabled: true }}
			/>
		</Stack>
	);
}
