import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "expo-router/react-navigation";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { claimMemberCache } from "@/lib/member-session";
import { connectQueryLifecycle } from "@/lib/query-lifecycle";
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

// Signing in or out swaps these stacks, which cross-fade instead of pushing.
const SWAPPED_STACK = { animation: "fade" } as const;

// Held until the stored session is read, so a signed-in member never sees the welcome screen flash.
void SplashScreen.preventAutoHideAsync();
connectQueryLifecycle();

export default function RootLayout() {
	const { isDarkColorScheme } = useColorScheme();
	const { data: session, isPending } = authClient.useSession();
	const isSignedIn = Boolean(session?.user);
	// isPending turns true again whenever a signed-out session refetches, so only the first read
	// gates the stack.
	const [isSessionRead, setIsSessionRead] = useState(false);
	if (!isPending && !isSessionRead) setIsSessionRead(true);
	// Before the member screens render, so none reads a previous member's cache.
	if (!isPending) claimMemberCache(session?.user.id ?? null);

	useEffect(() => {
		if (isSessionRead) SplashScreen.hide();
	}, [isSessionRead]);

	// Without a stack until then, the welcome screen can't mount under the splash, play its
	// entrance unseen, and cross-fade out as a signed-in member's tabs replace it.
	if (!isSessionRead) return null;

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
				<StatusBar style="auto" />
				<GestureHandlerRootView style={styles.container}>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Protected guard={isSignedIn}>
							<Stack.Screen name="(tabs)" options={SWAPPED_STACK} />
						</Stack.Protected>
						<Stack.Protected guard={!isSignedIn}>
							<Stack.Screen name="(auth)" options={SWAPPED_STACK} />
						</Stack.Protected>
						<Stack.Screen
							name="about"
							options={{
								presentation: "formSheet",
								sheetAllowedDetents: [0.6, 1],
								sheetGrabberVisible: true,
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
