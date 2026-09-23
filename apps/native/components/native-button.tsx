import type { ButtonVariant } from "@expo/ui";
import { Button as ExpoButton, Host } from "@expo/ui";
import type { StyleProp, ViewStyle } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type NativeButtonProps = {
	label: string;
	onPress: () => void;
	variant?: ButtonVariant;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
};

export function NativeButton({
	label,
	onPress,
	variant = "filled",
	disabled = false,
	style,
}: NativeButtonProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={[{ minHeight: 46, justifyContent: "center" }, style]}
		>
			<ExpoButton
				label={label}
				variant={variant}
				disabled={disabled}
				onPress={onPress}
				style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14 }}
			/>
		</Host>
	);
}
