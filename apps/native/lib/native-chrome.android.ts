import { useMaterialColors } from "@expo/ui/jetpack-compose";
import type { NativeTabsProps } from "expo-router/unstable-native-tabs";

import type { StackOptions } from "@/lib/native-chrome";
import { useColorScheme } from "@/lib/use-color-scheme";

// Same seeded palette the Compose screens use, so the app bar and navigation bar meet the content seamlessly.
function usePalette() {
	const { colorScheme, theme } = useColorScheme();
	return useMaterialColors({ colorScheme, seedColor: theme.primary });
}

export function useStackScreenOptions(): StackOptions {
	const colors = usePalette();

	return {
		headerStyle: { backgroundColor: colors.surface },
		headerTintColor: colors.onSurface,
		headerTitleStyle: { color: colors.onSurface },
		headerShadowVisible: false,
		contentStyle: { backgroundColor: colors.surface },
	};
}

export function useTabsAppearance(): Partial<NativeTabsProps> {
	const colors = usePalette();

	return {
		backgroundColor: colors.surfaceContainer,
		indicatorColor: colors.secondaryContainer,
		rippleColor: colors.onSurface,
		iconColor: {
			default: colors.onSurfaceVariant,
			selected: colors.onSecondaryContainer,
		},
		labelStyle: {
			default: { color: colors.onSurfaceVariant },
			selected: { color: colors.onSurface, fontWeight: "600" },
		},
		labelVisibilityMode: "labeled",
	};
}
