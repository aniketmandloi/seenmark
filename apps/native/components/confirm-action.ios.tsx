import type { ButtonVariant } from "@expo/ui";
import {
	Button,
	ConfirmationDialog,
	Text as ExpoText,
	Host,
} from "@expo/ui/swift-ui";
import {
	buttonBorderShape,
	buttonStyle,
	controlSize,
	disabled as disableControl,
} from "@expo/ui/swift-ui/modifiers";
import type { StyleProp, ViewStyle } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

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

function getButtonStyle(variant: ButtonVariant) {
	if (variant === "filled") return "borderedProminent";
	if (variant === "outlined") return "bordered";
	return "plain";
}

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
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={[{ minHeight: 46, justifyContent: "center" }, style]}
		>
			<ConfirmationDialog title={title}>
				<ConfirmationDialog.Trigger>
					{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
					<Button
						label={label}
						systemImage="trash"
						role="destructive"
						modifiers={[
							buttonStyle(getButtonStyle(variant)),
							buttonBorderShape("roundedRectangle", 14),
							controlSize("regular"),
							...(disabled ? [disableControl(true)] : []),
						]}
					/>
				</ConfirmationDialog.Trigger>
				<ConfirmationDialog.Message>
					<ExpoText>{message}</ExpoText>
				</ConfirmationDialog.Message>
				<ConfirmationDialog.Actions>
					{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
					<Button label={cancelLabel} role="cancel" />
					{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
					<Button label={confirmLabel} role="destructive" onPress={onConfirm} />
				</ConfirmationDialog.Actions>
			</ConfirmationDialog>
		</Host>
	);
}
