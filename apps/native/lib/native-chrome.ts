import type { Stack } from "expo-router";
import type { NativeTabsProps } from "expo-router/unstable-native-tabs";
import type { ComponentProps } from "react";
import { Platform } from "react-native";

import { useColorScheme } from "@/lib/use-color-scheme";

export type StackOptions = Exclude<
	NonNullable<ComponentProps<typeof Stack>["screenOptions"]>,
	(...args: never[]) => unknown
>;

// iOS 26 draws its own scroll-edge effect under a transparent bar; earlier versions need the blur.
const drawsScrollEdgeEffect =
	Platform.OS === "ios" && Number.parseInt(String(Platform.Version), 10) >= 26;

export function useStackScreenOptions(): StackOptions {
	const { theme } = useColorScheme();

	if (Platform.OS !== "ios") {
		return {
			headerStyle: { backgroundColor: theme.background },
			headerTintColor: theme.text,
			headerShadowVisible: false,
			contentStyle: { backgroundColor: theme.background },
		};
	}

	return {
		headerTransparent: true,
		headerBlurEffect: drawsScrollEdgeEffect ? "none" : "systemChromeMaterial",
		headerLargeStyle: { backgroundColor: "transparent" },
		headerShadowVisible: false,
		headerTintColor: theme.primary,
		headerTitleStyle: { color: theme.text },
		headerLargeTitleStyle: { color: theme.text },
		headerBackButtonDisplayMode: "minimal",
	};
}

export function useTabsAppearance(): Partial<NativeTabsProps> {
	const { theme } = useColorScheme();
	return { tintColor: theme.primary, sidebarAdaptable: true };
}
