import {
	Button,
	ConfirmationDialog,
	ContentUnavailableView,
	Form,
	Host,
	HStack,
	Image,
	Link,
	Picker,
	ProgressView,
	RNHostView,
	Section,
	SecureField,
	Spacer,
	Text,
	TextField,
	Toggle,
	useNativeState,
	VStack,
} from "@expo/ui/swift-ui";
import {
	aspectRatio,
	autocorrectionDisabled,
	buttonStyle,
	clipShape,
	controlSize,
	disabled as disableControl,
	font,
	foregroundStyle,
	frame,
	keyboardType,
	labelsHidden,
	listRowBackground,
	listRowInsets,
	type ModifierConfig,
	multilineTextAlignment,
	onSubmit,
	padding,
	pickerStyle,
	refreshable,
	scrollDismissesKeyboard,
	submitLabel,
	tag,
	textContentType,
	textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { Platform, Image as RNImage, StyleSheet, View } from "react-native";

import type {
	FormButtonProps,
	FormChoiceProps,
	FormConfirmButtonProps,
	FormEmptyStateProps,
	FormHeroProps,
	FormLinkProps,
	FormPhotosProps,
	FormProgressProps,
	FormRowProps,
	FormScreenProps,
	FormSectionProps,
	FormTextFieldProps,
	FormTextProps,
	FormToggleProps,
	Tone,
} from "@/components/form/types";
import { ICONS } from "@/lib/icons";
import { useColorScheme } from "@/lib/use-color-scheme";

// SwiftUI's ContentUnavailableView renders nothing before iOS 17.
const hasContentUnavailableView =
	Number.parseInt(String(Platform.Version), 10) >= 17;

const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });
const tertiary = foregroundStyle({ type: "hierarchical", style: "tertiary" });

function useToneStyle(tone: Tone): ModifierConfig[] {
	const { theme } = useColorScheme();
	if (tone === "destructive") return [foregroundStyle("red")];
	if (tone === "accent") return [foregroundStyle(theme.primary)];
	return [];
}

export function FormScreen({
	children,
	primaryAction,
	onRefresh,
}: FormScreenProps) {
	const { colorScheme, theme } = useColorScheme();

	return (
		<>
			{primaryAction ? (
				<Stack.Toolbar placement="right">
					<Stack.Toolbar.Button
						icon={ICONS[primaryAction.icon].ios}
						accessibilityLabel={primaryAction.label}
						disabled={primaryAction.disabled}
						onPress={primaryAction.onPress}
					/>
				</Stack.Toolbar>
			) : null}
			<Host
				style={styles.fill}
				useViewportSizeMeasurement
				colorScheme={colorScheme}
				seedColor={theme.primary}
			>
				<Form
					modifiers={[
						scrollDismissesKeyboard("interactively"),
						...(onRefresh ? [refreshable(onRefresh)] : []),
					]}
				>
					{children}
				</Form>
			</Host>
		</>
	);
}

export function FormHero({
	eyebrow,
	title,
	description,
	image,
}: FormHeroProps) {
	const { theme } = useColorScheme();

	return (
		<Section>
			<VStack
				alignment="leading"
				spacing={8}
				modifiers={[
					listRowBackground("clear"),
					listRowInsets({ top: 8, leading: 4, bottom: 8, trailing: 4 }),
				]}
			>
				{image ? (
					<RNHostView matchContents>
						<View pointerEvents="none" style={styles.heroImageFrame}>
							<RNImage source={image} style={styles.heroImage} />
						</View>
					</RNHostView>
				) : null}
				{eyebrow ? (
					<Text
						modifiers={[
							font({ textStyle: "caption", weight: "semibold" }),
							foregroundStyle(theme.primary),
						]}
					>
						{eyebrow.toUpperCase()}
					</Text>
				) : null}
				<Text modifiers={[font({ textStyle: "largeTitle", weight: "bold" })]}>
					{title}
				</Text>
				<Text modifiers={[font({ textStyle: "body" }), secondary]}>
					{description}
				</Text>
			</VStack>
		</Section>
	);
}

export function FormSection({ title, footer, children }: FormSectionProps) {
	return (
		<Section title={title} footer={footer ? <Text>{footer}</Text> : undefined}>
			{children}
		</Section>
	);
}

export const FormFields = FormSection;

export function FormRow({
	title,
	subtitle,
	value,
	icon,
	tone = "default",
	onPress,
	showsChevron = false,
	disabled = false,
}: FormRowProps) {
	const toneStyle = useToneStyle(tone);
	const { theme } = useColorScheme();

	const content = (
		<HStack spacing={12}>
			{icon ? (
				<Image
					systemName={ICONS[icon].ios}
					modifiers={[
						font({ textStyle: "body" }),
						foregroundStyle(tone === "destructive" ? "red" : theme.primary),
						frame({ width: 28 }),
					]}
				/>
			) : null}
			<VStack alignment="leading" spacing={2}>
				<Text
					modifiers={[
						foregroundStyle({ type: "hierarchical", style: "primary" }),
						...toneStyle,
					]}
				>
					{title}
				</Text>
				{subtitle ? (
					<Text modifiers={[font({ textStyle: "footnote" }), secondary]}>
						{subtitle}
					</Text>
				) : null}
			</VStack>
			<Spacer />
			{value ? <Text modifiers={[secondary]}>{value}</Text> : null}
			{showsChevron ? (
				<Image
					systemName="chevron.right"
					modifiers={[font({ size: 13, weight: "semibold" }), tertiary]}
				/>
			) : null}
		</HStack>
	);

	if (!onPress) return content;

	return (
		<Button
			onPress={onPress}
			modifiers={disabled ? [disableControl(true)] : undefined}
		>
			{content}
		</Button>
	);
}

export function FormText({
	children,
	variant = "body",
	muted = false,
}: FormTextProps) {
	return (
		<Text
			modifiers={[font({ textStyle: variant }), ...(muted ? [secondary] : [])]}
		>
			{children}
		</Text>
	);
}

export function FormButton({
	label,
	onPress,
	icon,
	disabled = false,
	prominent = false,
}: FormButtonProps) {
	const disabledModifiers = disabled ? [disableControl(true)] : [];

	if (prominent) {
		return (
			<Button
				onPress={onPress}
				modifiers={[
					buttonStyle("borderedProminent"),
					controlSize("large"),
					listRowBackground("clear"),
					listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
					...disabledModifiers,
				]}
			>
				<Text
					modifiers={[
						font({ textStyle: "headline" }),
						frame({ maxWidth: Number.POSITIVE_INFINITY }),
					]}
				>
					{label}
				</Text>
			</Button>
		);
	}

	return (
		<Button
			label={label}
			systemImage={icon ? ICONS[icon].ios : undefined}
			onPress={onPress}
			modifiers={disabledModifiers}
		/>
	);
}

export function FormConfirmButton({
	label,
	icon,
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	disabled = false,
}: FormConfirmButtonProps) {
	return (
		<ConfirmationDialog title={title} titleVisibility="visible">
			<ConfirmationDialog.Trigger>
				{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
				<Button
					label={label}
					systemImage={icon ? ICONS[icon].ios : undefined}
					role="destructive"
					modifiers={disabled ? [disableControl(true)] : undefined}
				/>
			</ConfirmationDialog.Trigger>
			<ConfirmationDialog.Message>
				<Text>{message}</Text>
			</ConfirmationDialog.Message>
			<ConfirmationDialog.Actions>
				{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
				<Button label={confirmLabel} role="destructive" onPress={onConfirm} />
				{/* biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole. */}
				<Button label={cancelLabel} role="cancel" />
			</ConfirmationDialog.Actions>
		</ConfirmationDialog>
	);
}

export function FormLink({ label, destination }: FormLinkProps) {
	return <Link label={label} destination={destination} />;
}

export function FormPhotos({ photos }: FormPhotosProps) {
	return (
		<HStack
			spacing={10}
			alignment="top"
			modifiers={[
				listRowInsets({ top: 12, leading: 12, bottom: 12, trailing: 12 }),
			]}
		>
			{photos.map((photo) => (
				<VStack key={photo.id} alignment="leading" spacing={6}>
					<VStack
						modifiers={[
							aspectRatio({ ratio: 4 / 5, contentMode: "fit" }),
							clipShape("roundedRectangle", photos.length > 1 ? 12 : 16),
						]}
					>
						<RNHostView>
							<RNImage
								source={{ uri: photo.uri }}
								style={styles.fill}
								resizeMode="cover"
								accessibilityLabel={photo.accessibilityLabel}
							/>
						</RNHostView>
					</VStack>
					<Text modifiers={[font({ textStyle: "footnote" }), secondary]}>
						{photo.caption}
					</Text>
				</VStack>
			))}
		</HStack>
	);
}

export function FormProgress({ label }: FormProgressProps) {
	return (
		<HStack spacing={10}>
			<ProgressView />
			<Text modifiers={[secondary]}>{label}</Text>
		</HStack>
	);
}

const FIELD_MODIFIERS: Record<FormTextFieldProps["kind"], ModifierConfig[]> = {
	name: [textContentType("name"), textInputAutocapitalization("words")],
	email: [
		textContentType("emailAddress"),
		keyboardType("email-address"),
		textInputAutocapitalization("never"),
		autocorrectionDisabled(),
	],
	password: [textContentType("password")],
	newPassword: [textContentType("newPassword")],
};

export function FormTextField({
	placeholder,
	kind,
	onChangeText,
	onSubmit: submit,
	submitLabel: label = "next",
}: FormTextFieldProps) {
	const text = useNativeState("");
	const modifiers = [
		...FIELD_MODIFIERS[kind],
		submitLabel(label),
		...(submit ? [onSubmit(submit)] : []),
	];

	if (kind === "password" || kind === "newPassword") {
		return (
			<SecureField
				text={text}
				placeholder={placeholder}
				onTextChange={onChangeText}
				modifiers={modifiers}
			/>
		);
	}

	return (
		<TextField
			text={text}
			placeholder={placeholder}
			onTextChange={onChangeText}
			modifiers={modifiers}
		/>
	);
}

export function FormToggle({ label, value, onValueChange }: FormToggleProps) {
	return <Toggle label={label} isOn={value} onIsOnChange={onValueChange} />;
}

export function FormChoice<T extends string>({
	options,
	selection,
	onSelectionChange,
	disabled = false,
}: FormChoiceProps<T>) {
	return (
		<Picker
			selection={selection}
			onSelectionChange={(value) => {
				if (value !== null) onSelectionChange(value as T);
			}}
			modifiers={[
				pickerStyle("segmented"),
				labelsHidden(),
				...(disabled ? [disableControl(true)] : []),
			]}
		>
			{options.map((option) => (
				<Text key={option.value} modifiers={[tag(option.value)]}>
					{option.label}
				</Text>
			))}
		</Picker>
	);
}

export function FormEmptyState({
	icon,
	title,
	description,
}: FormEmptyStateProps) {
	if (hasContentUnavailableView) {
		return (
			<Section>
				<ContentUnavailableView
					title={title}
					systemImage={ICONS[icon].ios}
					description={description}
					modifiers={[listRowBackground("clear")]}
				/>
			</Section>
		);
	}

	return (
		<Section>
			<VStack
				spacing={8}
				modifiers={[
					frame({ maxWidth: Number.POSITIVE_INFINITY }),
					padding({ vertical: 24 }),
					listRowBackground("clear"),
				]}
			>
				<Image
					systemName={ICONS[icon].ios}
					modifiers={[font({ size: 44 }), secondary]}
				/>
				<Text modifiers={[font({ textStyle: "title2", weight: "bold" })]}>
					{title}
				</Text>
				<Text
					modifiers={[
						font({ textStyle: "subheadline" }),
						secondary,
						multilineTextAlignment("center"),
					]}
				>
					{description}
				</Text>
			</VStack>
		</Section>
	);
}

const styles = StyleSheet.create({
	fill: {
		flex: 1,
	},
	heroImageFrame: {
		width: 64,
		height: 64,
		marginBottom: 8,
	},
	heroImage: {
		width: 64,
		height: 64,
		borderRadius: 15,
	},
});
