import { Stack } from "expo-router";

import { useStackScreenOptions } from "@/lib/native-chrome";

export default function AccountStack() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen
				name="index"
				options={{ title: "Account", headerLargeTitleEnabled: true }}
			/>
		</Stack>
	);
}
