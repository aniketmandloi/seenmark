import { Stack } from "expo-router";

import { useStackScreenOptions } from "@/lib/native-chrome";

export default function AuthStack() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen name="welcome" options={{ headerShown: false }} />
			<Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
			<Stack.Screen name="sign-up" options={{ title: "Create account" }} />
		</Stack>
	);
}
