import {
	Button,
	ConfirmationDialog,
	ContentUnavailableView,
	ContextMenu,
	Form,
	Group,
	Host,
	HStack,
	Image,
	Link,
	Picker,
	ProgressView,
	RNHostView,
	RoundedRectangle,
	Section,
	SecureField,
	Slider,
	Spacer,
	Text,
	TextField,
	Toggle,
	useNativeState,
	VStack,
} from "@expo/ui/swift-ui";
import {
	accessibilityElement,
	accessibilityHidden,
	accessibilityLabel,
	aspectRatio,
	autocorrectionDisabled,
	background,
	buttonStyle,
	clipShape,
	contentTransition,
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
	monospacedDigit,
	multilineTextAlignment,
	offset,
	onAppear,
	onSubmit,
	opacity,
	padding,
	pickerStyle,
	redacted,
	refreshable,
	scrollDismissesKeyboard,
	submitLabel,
	symbolEffect,
	tag,
	textContentType,
	textInputAutocapitalization,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { type ReactNode, useState } from "react";
import { Platform, Image as RNImage, StyleSheet, View } from "react-native";

import {
	type ChoiceStatus,
	useChoiceStatus,
} from "@/components/form/choice-status";
import { ComparedPhotos } from "@/components/form/compared-photos";
import { FadeInPhoto } from "@/components/form/fade-in-photo";
import type {
	FormButtonProps,
	FormChoiceProps,
	FormCompareSliderProps,
	FormConfirmation,
	FormConfirmButtonProps,
	FormEmptyStateProps,
	FormErrorStateProps,
	FormHeroProps,
	FormLinkProps,
	FormPhotosProps,
	FormPickerProps,
	FormProgressProps,
	FormRevealProps,
	FormRowAction,
	FormRowProps,
	FormScreenProps,
	FormSectionProps,
	FormSkeletonProps,
	FormStepProps,
	FormTextFieldProps,
	FormTextProps,
	FormToggleProps,
	Tone,
} from "@/components/form/types";
import { SKELETON_COUNT } from "@/components/form/types";
import { ICONS } from "@/lib/icons";
import { staggerDelay, useMotion } from "@/lib/motion";
import { easeOut } from "@/lib/swift-ui-motion";
import { useColorScheme } from "@/lib/use-color-scheme";

// SwiftUI's ContentUnavailableView renders nothing before iOS 17.
const hasContentUnavailableView =
	Number.parseInt(String(Platform.Version), 10) >= 17;

const secondary = foregroundStyle({ type: "hierarchical", style: "secondary" });
const tertiary = foregroundStyle({ type: "hierarchical", style: "tertiary" });
const quaternary = foregroundStyle({
	type: "hierarchical",
	style: "quaternary",
});

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
						disabled={primaryAction.disabled || primaryAction.pending}
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
	actions,
}: FormRowProps) {
	const toneStyle = useToneStyle(tone);
	const { theme } = useColorScheme();
	const [confirming, setConfirming] = useState<FormRowAction | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);

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
			{value ? (
				<Text modifiers={[secondary, monospacedDigit()]}>{value}</Text>
			) : null}
			{showsChevron ? (
				<Image
					systemName="chevron.right"
					modifiers={[font({ size: 13, weight: "semibold" }), tertiary]}
				/>
			) : null}
		</HStack>
	);

	const row = onPress ? (
		<Button
			onPress={onPress}
			modifiers={disabled ? [disableControl(true)] : undefined}
		>
			{content}
		</Button>
	) : (
		content
	);

	if (!actions?.length) return row;

	// The dialog keeps the last action it asked about while it animates away.
	return (
		<ConfirmDialog
			{...(confirming?.confirm ?? NO_CONFIRMATION)}
			onConfirm={() => confirming?.onPress()}
			isPresented={isConfirming}
			onIsPresentedChange={setIsConfirming}
		>
			<ContextMenu>
				<ContextMenu.Trigger>{row}</ContextMenu.Trigger>
				<ContextMenu.Items>
					{actions.map((action) => (
						<Button
							key={action.label}
							label={action.label}
							systemImage={action.icon ? ICONS[action.icon].ios : undefined}
							role={action.destructive ? "destructive" : undefined}
							onPress={() => {
								if (!action.confirm) {
									action.onPress();
									return;
								}
								setConfirming(action);
								setIsConfirming(true);
							}}
							modifiers={action.disabled ? [disableControl(true)] : undefined}
						/>
					))}
				</ContextMenu.Items>
			</ContextMenu>
		</ConfirmDialog>
	);
}

const NO_CONFIRMATION: FormConfirmation = {
	title: "",
	message: "",
	confirmLabel: "",
};

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

function PendingLabel({
	label,
	modifiers = [],
}: {
	label: string;
	modifiers?: ModifierConfig[];
}) {
	return (
		<HStack spacing={8} modifiers={modifiers}>
			<ProgressView modifiers={[controlSize("small")]} />
			<Text>{label}</Text>
		</HStack>
	);
}

export function FormButton({
	label,
	onPress,
	icon,
	disabled = false,
	pending = false,
	prominent = false,
}: FormButtonProps) {
	const disabledModifiers = disabled || pending ? [disableControl(true)] : [];

	if (prominent) {
		const fill = frame({ maxWidth: Number.POSITIVE_INFINITY });
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
				{pending ? (
					<PendingLabel
						label={label}
						modifiers={[font({ textStyle: "headline" }), fill]}
					/>
				) : (
					<Text modifiers={[font({ textStyle: "headline" }), fill]}>
						{label}
					</Text>
				)}
			</Button>
		);
	}

	if (pending) {
		return (
			<Button onPress={onPress} modifiers={disabledModifiers}>
				<PendingLabel label={label} />
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
	pending = false,
}: FormConfirmButtonProps) {
	const modifiers = disabled || pending ? [disableControl(true)] : undefined;
	const [isPresented, setIsPresented] = useState(false);
	const present = () => setIsPresented(true);

	return (
		<ConfirmDialog
			title={title}
			message={message}
			confirmLabel={confirmLabel}
			cancelLabel={cancelLabel}
			onConfirm={onConfirm}
			isPresented={isPresented}
			onIsPresentedChange={setIsPresented}
		>
			{pending ? (
				// biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole.
				<Button role="destructive" onPress={present} modifiers={modifiers}>
					<PendingLabel label={label} />
				</Button>
			) : (
				// biome-ignore lint/a11y/useValidAriaRole: Expo UI maps this prop to SwiftUI's ButtonRole.
				<Button
					label={label}
					systemImage={icon ? ICONS[icon].ios : undefined}
					role="destructive"
					onPress={present}
					modifiers={modifiers}
				/>
			)}
		</ConfirmDialog>
	);
}

/** A destructive confirmation attached to `children`, shown while `isPresented`. */
function ConfirmDialog({
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	isPresented,
	onIsPresentedChange,
	children,
}: FormConfirmation & {
	onConfirm: () => void;
	isPresented: boolean;
	onIsPresentedChange: (isPresented: boolean) => void;
	children: ReactNode;
}) {
	return (
		<ConfirmationDialog
			title={title}
			titleVisibility="visible"
			isPresented={isPresented}
			onIsPresentedChange={onIsPresentedChange}
		>
			<ConfirmationDialog.Trigger>{children}</ConfirmationDialog.Trigger>
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
							background({ type: "hierarchical", style: "quaternary" }),
							clipShape("roundedRectangle", photos.length > 1 ? 12 : 16),
						]}
					>
						<RNHostView>
							<FadeInPhoto
								key={photo.id}
								uri={photo.uri}
								accessibilityLabel={photo.accessibilityLabel}
								style={styles.fill}
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

export function FormCompareSlider({ earlier, latest }: FormCompareSliderProps) {
	const [position, setPosition] = useState(50);
	const caption = [font({ textStyle: "footnote" }), secondary];

	// iOS never draws a slider's label; VoiceOver reads it.
	return (
		<VStack
			alignment="leading"
			spacing={6}
			modifiers={[
				listRowInsets({ top: 12, leading: 12, bottom: 12, trailing: 12 }),
			]}
		>
			<VStack
				modifiers={[
					aspectRatio({ ratio: 4 / 5, contentMode: "fit" }),
					background({ type: "hierarchical", style: "quaternary" }),
					clipShape("roundedRectangle", 16),
				]}
			>
				<RNHostView>
					<ComparedPhotos
						earlier={earlier}
						latest={latest}
						position={position}
						style={styles.fill}
					/>
				</RNHostView>
			</VStack>
			<HStack>
				<Text modifiers={caption}>{earlier.caption}</Text>
				<Spacer />
				<Text modifiers={caption}>{latest.caption}</Text>
			</HStack>
			<Slider
				value={position}
				min={0}
				max={100}
				onValueChange={setPosition}
				label={<Text>Divider between the earlier and latest photos</Text>}
				minimumValueLabel={<Text modifiers={caption}>Earlier</Text>}
				maximumValueLabel={<Text modifiers={caption}>Latest</Text>}
				modifiers={[padding({ top: 6 })]}
			/>
		</VStack>
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
	pendingValue,
}: FormChoiceProps<T>) {
	const status = useChoiceStatus(pendingValue, selection);

	return (
		<>
			<Picker
				selection={selection}
				onSelectionChange={(value) => {
					if (value !== null) onSelectionChange(value as T);
				}}
				modifiers={[
					pickerStyle("segmented"),
					labelsHidden(),
					...(disabled || pendingValue !== undefined
						? [disableControl(true)]
						: []),
				]}
			>
				{options.map((option) => (
					<Text key={option.value} modifiers={[tag(option.value)]}>
						{option.label}
					</Text>
				))}
			</Picker>
			{status ? <ChoiceStatusRow status={status} /> : null}
		</>
	);
}

/** A segmented control can't hold a spinner per segment, so a save shows in a row under it. */
function ChoiceStatusRow({ status }: { status: ChoiceStatus }) {
	const motion = useMotion();
	const { theme } = useColorScheme();
	const checkShown = useNativeState(false);
	const saved = status !== "saving";
	const footnote = font({ textStyle: "footnote" });

	if (status === "fading" && motion.reduced) return null;

	// A symbol effect runs whatever easeOut decides, so under reduced motion it is left off.
	return (
		<HStack
			spacing={6}
			modifiers={[
				opacity(status === "fading" ? 0 : 1),
				...easeOut(motion, motion.slow, status === "fading"),
			]}
		>
			{saved ? (
				<Image
					systemName={ICONS.done.ios}
					modifiers={[
						footnote,
						foregroundStyle(theme.success),
						...(motion.reduced
							? []
							: [
									symbolEffect({ effect: "appear" }, { isActive: checkShown }),
									onAppear(() => checkShown.set(true)),
								]),
					]}
				/>
			) : (
				<ProgressView modifiers={[controlSize("small")]} />
			)}
			<Text
				modifiers={[
					footnote,
					secondary,
					...(motion.reduced ? [] : [contentTransition("opacity")]),
					...easeOut(motion, motion.base, saved),
				]}
			>
				{saved ? "Saved" : "Saving…"}
			</Text>
		</HStack>
	);
}

export function FormPicker({
	label,
	options,
	selection,
	onSelectionChange,
}: FormPickerProps) {
	return (
		<Picker
			label={label}
			selection={selection}
			onSelectionChange={onSelectionChange}
			modifiers={[pickerStyle("menu")]}
		>
			{options.map((option) => (
				<Text
					key={option.value}
					modifiers={[
						tag(option.value),
						...(option.disabled ? [disableControl(true)] : []),
					]}
				>
					{option.label}
				</Text>
			))}
		</Picker>
	);
}

export function FormStep({ number, total, text }: FormStepProps) {
	const { theme } = useColorScheme();

	return (
		<HStack
			alignment="firstTextBaseline"
			spacing={14}
			modifiers={[
				padding({ vertical: 6 }),
				accessibilityElement("ignore"),
				accessibilityLabel(`Step ${number} of ${total}: ${text}`),
			]}
		>
			<Text
				modifiers={[
					font({ textStyle: "title3", weight: "semibold" }),
					monospacedDigit(),
					foregroundStyle(theme.primary),
				]}
			>
				{String(number).padStart(2, "0")}
			</Text>
			<Text>{text}</Text>
		</HStack>
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

export function FormReveal({ children, index = 0 }: FormRevealProps) {
	const motion = useMotion();
	const [appeared, setAppeared] = useState(motion.reduced);

	// Group passes its modifiers to each child, so every row inside stays its own Form row.
	return (
		<Group
			modifiers={[
				opacity(appeared ? 1 : 0),
				offset({ y: appeared ? 0 : motion.rise }),
				...easeOut(motion, motion.slow, appeared, staggerDelay(motion, index)),
				...(appeared ? [] : [onAppear(() => setAppeared(true))]),
			]}
		>
			{children}
		</Group>
	);
}

const PLACEHOLDER_DATE = "September 27, 2026";
const PLACEHOLDER_STEP =
	"A placeholder step about as long as the one that will replace it.";
const PLACEHOLDER_OPTIONS = ["one", "two", "three", "four", "five"].map(
	(value) => ({ value, label: "Option" }),
);

/** Kit rows redacted as placeholders, so the loaded content lands where they stood. */
export function FormSkeleton({
	shape,
	count = SKELETON_COUNT[shape],
	label,
}: FormSkeletonProps) {
	// VoiceOver reads the label once, on the first placeholder, and skips the rest.
	const readAs = (index: number) =>
		index === 0
			? [accessibilityElement("ignore"), accessibilityLabel(label)]
			: [accessibilityHidden(true)];
	const slots = Array.from({ length: count }, (_, index) => index);

	if (shape === "photos") {
		return (
			<HStack
				spacing={10}
				alignment="top"
				modifiers={[
					listRowInsets({ top: 12, leading: 12, bottom: 12, trailing: 12 }),
					redacted("placeholder"),
					...readAs(0),
				]}
			>
				{slots.map((index) => (
					<VStack key={index} alignment="leading" spacing={6}>
						<RoundedRectangle
							cornerRadius={count > 1 ? 12 : 16}
							modifiers={[
								aspectRatio({ ratio: 4 / 5, contentMode: "fit" }),
								quaternary,
							]}
						/>
						<Text modifiers={[font({ textStyle: "footnote" }), secondary]}>
							{PLACEHOLDER_DATE}
						</Text>
					</VStack>
				))}
			</HStack>
		);
	}

	if (shape === "choice") {
		return (
			<Group modifiers={[redacted("placeholder"), ...readAs(0)]}>
				<FormChoice
					options={PLACEHOLDER_OPTIONS.slice(0, count)}
					selection={null}
					onSelectionChange={() => undefined}
					disabled
				/>
			</Group>
		);
	}

	return (
		<>
			{slots.map((index) => (
				<Group
					key={index}
					modifiers={[redacted("placeholder"), ...readAs(index)]}
				>
					{shape === "rows" ? (
						<FormRow icon="camera" title={PLACEHOLDER_DATE} />
					) : (
						<FormStep
							number={index + 1}
							total={count}
							text={PLACEHOLDER_STEP}
						/>
					)}
				</Group>
			))}
		</>
	);
}

/** A failed read with a way to try it again; shared so every screen fails the same way. */
export function FormErrorState({
	message,
	footer,
	retrying,
	onRetry,
}: FormErrorStateProps) {
	return (
		<FormReveal>
			<FormSection footer={footer}>
				<FormRow icon="error" title={message} tone="destructive" />
				<FormButton
					label={retrying ? "Trying…" : "Try again"}
					onPress={onRetry}
					pending={retrying}
				/>
			</FormSection>
		</FormReveal>
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
