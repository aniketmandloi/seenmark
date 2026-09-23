import { TextInput as ExpoTextInput, Host } from "@expo/ui";
import { type KeyboardTypeOptions, useWindowDimensions } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type NativeTextFieldProps = {
	defaultValue: string;
	placeholder: string;
	onChangeText: (value: string) => void;
	onSubmitEditing?: () => void;
	keyboardType?: KeyboardTypeOptions;
	secureTextEntry?: boolean;
	autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export function NativeTextField({
	defaultValue,
	placeholder,
	onChangeText,
	onSubmitEditing,
	keyboardType,
	secureTextEntry,
	autoCapitalize,
}: NativeTextFieldProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const { width } = useWindowDimensions();
	const fieldWidth = Math.max(180, Math.min(width - 104, 420));

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			style={{ width: fieldWidth, height: 52, marginBottom: 12 }}
		>
			<ExpoTextInput
				defaultValue={defaultValue}
				placeholder={placeholder}
				placeholderTextColor={theme.muted}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmitEditing}
				keyboardType={keyboardType}
				secureTextEntry={secureTextEntry}
				autoCapitalize={autoCapitalize}
				textStyle={{ color: theme.text, fontSize: 16 }}
				style={{
					width: fieldWidth,
					height: 52,
					paddingHorizontal: 14,
					paddingVertical: 12,
					borderWidth: 1,
					borderRadius: 13,
					borderColor: theme.border,
					backgroundColor: theme.background,
				}}
			/>
		</Host>
	);
}
