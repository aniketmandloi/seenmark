import type { ButtonVariant } from "@expo/ui";
import type { StyleProp, ViewStyle } from "react-native";
import { Alert } from "react-native";

import { NativeButton } from "@/components/native-button";

type ConfirmActionProps = {
	label: string;
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	disabled?: boolean;
	variant?: ButtonVariant;
	style?: StyleProp<ViewStyle>;
};

export function ConfirmAction({
	label,
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	disabled = false,
	variant = "text",
	style,
}: ConfirmActionProps) {
	return (
		<NativeButton
			label={label}
			variant={variant}
			disabled={disabled}
			style={style}
			onPress={() =>
				Alert.alert(title, message, [
					{ text: cancelLabel, style: "cancel" },
					{
						text: confirmLabel,
						style: "destructive",
						onPress: onConfirm,
					},
				])
			}
		/>
	);
}
