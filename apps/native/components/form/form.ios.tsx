import {
	Background,
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
	accessibilityAddTraits,
	accessibilityElement,
	accessibilityHidden,
	accessibilityLabel,
	aspectRatio,
	autocorrectionDisabled,
	background,
	buttonBorderShape,
	buttonStyle,
	clipShape,
	contentTransition,
	controlSize,
	disabled as disableControl,
	font,
	foregroundStyle,
	frame,
	kerning,
	keyboardType,
	labelsHidden,
	listRowBackground,
	listRowInsets,
	type ModifierConfig,
	monospacedDigit,
	multilineTextAlignment,
	offset,
	onAppear,
	onDisappear,
	onSubmit,
	opacity,
	padding,
	pickerStyle,
	redacted,
	refreshable,
	rotationEffect,
	scrollDismissesKeyboard,
	shapes,
	submitLabel,
	symbolEffect,
	tag,
	textContentType,
	textInputAutocapitalization,
	tint,
} from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { type ReactNode, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import {
	type ChoiceStatus,
	useChoiceStatus,
} from "@/components/form/choice-status";
import { ComparedPhotos } from "@/components/form/compared-photos";
import { FadeInPhoto } from "@/components/form/fade-in-photo";
import { splitHighlight } from "@/components/form/highlight";
import { Logo } from "@/components/form/logo";
import { useStackedRows } from "@/components/form/text-scale";
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
import { DISPLAY_FONT } from "@/lib/constants";
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

function toneStyle(tone: Tone): ModifierConfig[] {
	if (tone === "destructive") return [foregroundStyle("red")];
	if (tone === "accent")
		return [font({ textStyle: "body", weight: "semibold" })];
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
				seedColor={theme.text}
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

function HeroPart({
	reveal,
	index,
	children,
}: FormRevealProps & { reveal: boolean }) {
	return reveal ? <FormReveal index={index}>{children}</FormReveal> : children;
}

const heroTitleFont = [
	font({ family: DISPLAY_FONT, size: 34, textStyle: "largeTitle" }),
	kerning(-1),
];

/** SwiftUI can't draw a mark behind part of one Text, so the marked words get their own line. */
function HeroTitle({
	title,
	highlight,
}: Pick<FormHeroProps, "title" | "highlight">) {
	const { theme } = useColorScheme();
	const parts = splitHighlight(title, highlight);

	if (!parts) {
		return (
			<Text
				modifiers={[...heroTitleFont, accessibilityAddTraits(["isHeader"])]}
			>
				{title}
			</Text>
		);
	}

	return (
		<VStack
			alignment="leading"
			spacing={0}
			modifiers={[
				accessibilityElement("ignore"),
				accessibilityLabel(title),
				accessibilityAddTraits(["isHeader"]),
			]}
		>
			{parts.before.trim() ? (
				<Text modifiers={heroTitleFont}>{parts.before.trim()}</Text>
			) : null}
			<HStack spacing={0}>
				<Background>
					<Text
						modifiers={[
							...heroTitleFont,
							foregroundStyle(theme.primaryForeground),
						]}
					>
						{parts.marked}
					</Text>
					<Background.Content>
						<RoundedRectangle
							cornerRadius={8}
							modifiers={[
								foregroundStyle(theme.primary),
								padding({ horizontal: -5 }),
								rotationEffect(-1.2),
							]}
						/>
					</Background.Content>
				</Background>
				{parts.after ? (
					<Text modifiers={heroTitleFont}>{parts.after}</Text>
				) : null}
			</HStack>
		</VStack>
	);
}

export function FormHero({
	eyebrow,
	title,
	highlight,
	description,
	logo = false,
	reveal = false,
}: FormHeroProps) {
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
				{logo ? (
					<HeroPart reveal={reveal} index={0}>
						<RNHostView matchContents>
							<View pointerEvents="none" style={styles.heroLogo}>
								<Logo />
							</View>
						</RNHostView>
					</HeroPart>
				) : null}
				{eyebrow ? (
					<HeroPart reveal={reveal} index={1}>
						<Text
							modifiers={[
								font({ textStyle: "subheadline", weight: "medium" }),
								secondary,
							]}
						>
							{eyebrow}
						</Text>
					</HeroPart>
				) : null}
				<HeroPart reveal={reveal} index={2}>
					<HeroTitle title={title} highlight={highlight} />
				</HeroPart>
				<HeroPart reveal={reveal} index={3}>
					<Text modifiers={[font({ textStyle: "body" }), secondary]}>
						{description}
					</Text>
				</HeroPart>
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
	const { theme } = useColorScheme();
	const [confirming, setConfirming] = useState<FormRowAction | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const stacked = useStackedRows();
	const valueText = value ? (
		<Text modifiers={[secondary, monospacedDigit()]}>{value}</Text>
	) : null;

	const content = (
		<HStack spacing={12}>
			{icon ? (
				<Image
					systemName={ICONS[icon].ios}
					modifiers={[
						...(tone === "accent"
							? [
									font({ textStyle: "subheadline", weight: "semibold" }),
									foregroundStyle(theme.primaryForeground),
									frame({ width: 28, height: 28 }),
									background(theme.primary, shapes.circle()),
								]
							: [
									font({ textStyle: "body" }),
									foregroundStyle(tone === "destructive" ? "red" : theme.text),
									frame({ minWidth: 28 }),
								]),
						accessibilityHidden(true),
					]}
				/>
			) : null}
			<VStack alignment="leading" spacing={2}>
				<Text
					modifiers={[
						foregroundStyle({ type: "hierarchical", style: "primary" }),
						...toneStyle(tone),
					]}
				>
					{title}
				</Text>
				{subtitle ? (
					<Text modifiers={[font({ textStyle: "footnote" }), secondary]}>
						{subtitle}
					</Text>
				) : null}
				{stacked ? valueText : null}
			</VStack>
			<Spacer />
			{stacked ? null : valueText}
			{showsChevron ? (
				<Image
					systemName="chevron.right"
					modifiers={[
						font({ textStyle: "footnote", weight: "semibold" }),
						tertiary,
						accessibilityHidden(true),
					]}
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
			<ProgressView
				modifiers={[controlSize("small"), accessibilityHidden(true)]}
			/>
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
	const { theme } = useColorScheme();
	const disabledModifiers = disabled || pending ? [disableControl(true)] : [];

	if (prominent) {
		const labelStyle = [
			font({ textStyle: "headline" }),
			frame({ maxWidth: Number.POSITIVE_INFINITY }),
			foregroundStyle(theme.primaryForeground),
		];
		return (
			<Button
				onPress={onPress}
				modifiers={[
					buttonStyle("borderedProminent"),
					buttonBorderShape("capsule"),
					tint(theme.primary),
					controlSize("large"),
					listRowBackground("clear"),
					listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
					...disabledModifiers,
				]}
			>
				{pending ? (
					<PendingLabel
						label={label}
						modifiers={[...labelStyle, tint(theme.primaryForeground)]}
					/>
				) : (
					<Text modifiers={labelStyle}>{label}</Text>
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
	const stacked = useStackedRows();
	const host = (
		<Text modifiers={[secondary]}>{new URL(destination).hostname}</Text>
	);

	return (
		<Link destination={destination}>
			{stacked ? (
				<VStack alignment="leading" spacing={2}>
					<Text>{label}</Text>
					{host}
				</VStack>
			) : (
				<HStack spacing={12}>
					<Text>{label}</Text>
					<Spacer />
					{host}
				</HStack>
			)}
		</Link>
	);
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
					<Text
						modifiers={[
							font({ textStyle: "footnote" }),
							secondary,
							accessibilityHidden(true),
						]}
					>
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
				<Text modifiers={[...caption, accessibilityHidden(true)]}>
					{earlier.caption}
				</Text>
				<Spacer />
				<Text modifiers={[...caption, accessibilityHidden(true)]}>
					{latest.caption}
				</Text>
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
	const { theme } = useColorScheme();

	// The screen's ink tint would draw a dark-mode switch almost as light as its knob.
	return (
		<Toggle
			label={label}
			isOn={value}
			onIsOnChange={onValueChange}
			modifiers={[tint(theme.primary)]}
		/>
	);
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
					systemName={ICONS.check.ios}
					modifiers={[
						font({ textStyle: "caption2", weight: "bold" }),
						foregroundStyle(theme.primaryForeground),
						frame({ minWidth: 18, minHeight: 18 }),
						background(theme.primary, shapes.circle()),
						accessibilityHidden(true),
						...(motion.reduced
							? []
							: [
									symbolEffect({ effect: "appear" }, { isActive: checkShown }),
									onAppear(() => checkShown.set(true)),
									onDisappear(() => checkShown.set(false)),
								]),
					]}
				/>
			) : (
				<ProgressView
					modifiers={[controlSize("small"), accessibilityHidden(true)]}
				/>
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
					font({ family: DISPLAY_FONT, size: 17, textStyle: "headline" }),
					monospacedDigit(),
					foregroundStyle(theme.primaryForeground),
					frame({ minWidth: 32, minHeight: 32 }),
					background(theme.primary, shapes.circle()),
				]}
			>
				{number}
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
					modifiers={[font({ size: 44 }), secondary, accessibilityHidden(true)]}
				/>
				<Text
					modifiers={[
						font({ family: DISPLAY_FONT, size: 22, textStyle: "title2" }),
					]}
				>
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
	heroLogo: {
		marginBottom: 8,
	},
});
