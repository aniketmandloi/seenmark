import type { NativeTabsProps } from "expo-router/unstable-native-tabs";

import type { StackOptions } from "@/lib/native-chrome";
import { useColorScheme } from "@/lib/use-color-scheme";

// The same cool surfaces the Compose screens draw on, so the app bar and navigation bar meet the
// content seamlessly. The yellow indicator is the web header's pill under the current page.
export function useStackScreenOptions(): StackOptions {
	const { theme } = useColorScheme();

	return {
		headerStyle: { backgroundColor: theme.background },
		headerTintColor: theme.text,
		headerTitleStyle: { color: theme.text },
		headerShadowVisible: false,
		contentStyle: { backgroundColor: theme.background },
	};
}

export function useTabsAppearance(): Partial<NativeTabsProps> {
	const { theme } = useColorScheme();

	return {
		backgroundColor: theme.background,
		indicatorColor: theme.primary,
		rippleColor: theme.text,
		iconColor: {
			default: theme.muted,
			selected: theme.primaryForeground,
		},
		labelStyle: {
			default: { color: theme.muted },
			selected: { color: theme.text, fontWeight: "600" },
		},
		labelVisibilityMode: "labeled",
	};
}
