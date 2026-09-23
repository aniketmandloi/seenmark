import type { StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type ProgressIndicatorProps = {
	style?: StyleProp<ViewStyle>;
};

export function ProgressIndicator({ style }: ProgressIndicatorProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	return <ActivityIndicator size="small" color={theme.primary} style={style} />;
}
