import type { ButtonVariant } from "@expo/ui";
import {
	AlertDialog,
	Button as ComposeButton,
	Text as ComposeText,
	Host,
	OutlinedButton,
	TextButton,
} from "@expo/ui/jetpack-compose";
import { useState } from "react";
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
	const [isPresented, setIsPresented] = useState(false);
	const destructiveColors = { contentColor: theme.notification };

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={[{ minHeight: 46, justifyContent: "center" }, style]}
		>
			{variant === "filled" ? (
				<ComposeButton
					enabled={!disabled}
					colors={{
						containerColor: theme.notification,
						contentColor: theme.background,
					}}
					onClick={() => setIsPresented(true)}
				>
					<ComposeText>{label}</ComposeText>
				</ComposeButton>
			) : variant === "outlined" ? (
				<OutlinedButton
					enabled={!disabled}
					colors={destructiveColors}
					onClick={() => setIsPresented(true)}
				>
					<ComposeText>{label}</ComposeText>
				</OutlinedButton>
			) : (
				<TextButton
					enabled={!disabled}
					colors={destructiveColors}
					onClick={() => setIsPresented(true)}
				>
					<ComposeText>{label}</ComposeText>
				</TextButton>
			)}
			{isPresented ? (
				<AlertDialog
					onDismissRequest={() => setIsPresented(false)}
					colors={{
						containerColor: theme.card,
						titleContentColor: theme.text,
						textContentColor: theme.muted,
					}}
				>
					<AlertDialog.Title>
						<ComposeText>{title}</ComposeText>
					</AlertDialog.Title>
					<AlertDialog.Text>
						<ComposeText>{message}</ComposeText>
					</AlertDialog.Text>
					<AlertDialog.DismissButton>
						<TextButton onClick={() => setIsPresented(false)}>
							<ComposeText>{cancelLabel}</ComposeText>
						</TextButton>
					</AlertDialog.DismissButton>
					<AlertDialog.ConfirmButton>
						<TextButton
							colors={destructiveColors}
							onClick={() => {
								setIsPresented(false);
								onConfirm();
							}}
						>
							<ComposeText>{confirmLabel}</ComposeText>
						</TextButton>
					</AlertDialog.ConfirmButton>
				</AlertDialog>
			) : null}
		</Host>
	);
}
