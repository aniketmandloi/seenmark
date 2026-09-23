import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient } from "@/utils/trpc";

const LIGHT_THEME = {
	...DefaultTheme,
	colors: NAV_THEME.light,
};
const DARK_THEME = {
	...DarkTheme,
	colors: NAV_THEME.dark,
};

// Held until the stored session is read, so a signed-in member never sees the welcome screen flash.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();
	const { data: session, isPending } = authClient.useSession();
	const isSignedIn = Boolean(session?.user);

	useEffect(() => {
		if (!isPending) SplashScreen.hide();
	}, [isPending]);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
				<StatusBar style="auto" />
				<GestureHandlerRootView style={styles.container}>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Protected guard={isSignedIn}>
							<Stack.Screen name="(tabs)" />
						</Stack.Protected>
						<Stack.Protected guard={!isSignedIn}>
							<Stack.Screen name="(auth)" />
						</Stack.Protected>
						<Stack.Screen
							name="modal"
							options={{
								headerShown: true,
								title: "About Seenmark",
								presentation: "modal",
							}}
						/>
					</Stack>
				</GestureHandlerRootView>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
