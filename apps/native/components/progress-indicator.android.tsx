import { CircularProgressIndicator, Host } from "@expo/ui/jetpack-compose";
import type { StyleProp, ViewStyle } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type ProgressIndicatorProps = {
	style?: StyleProp<ViewStyle>;
};

export function ProgressIndicator({ style }: ProgressIndicatorProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents
			style={[{ width: 20, height: 20, justifyContent: "center" }, style]}
		>
			<CircularProgressIndicator color={theme.primary} />
		</Host>
	);
}
