import * as ExpoLinking from "expo-linking";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	type AlertButton,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	View,
} from "react-native";
import Animated, { Easing, FadeInDown } from "react-native-reanimated";

import { useChoiceStatus } from "@/components/form/choice-status";
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
	FormRowProps,
	FormScreenProps,
	FormSectionProps,
	FormSkeletonProps,
	FormStepProps,
	FormTextFieldProps,
	FormTextProps,
	FormToggleProps,
} from "@/components/form/types";
import { SKELETON_COUNT } from "@/components/form/types";
import { staggerDelay, useMotion } from "@/lib/motion";
import { useColorScheme } from "@/lib/use-color-scheme";

export function FormScreen({
	children,
	primaryAction,
	onRefresh,
}: FormScreenProps) {
	const { theme } = useColorScheme();
	const [isRefreshing, setIsRefreshing] = useState(false);

	return (
		<ScrollView
			style={{ backgroundColor: theme.background }}
			contentContainerStyle={styles.screen}
			keyboardShouldPersistTaps="handled"
			refreshControl={
				onRefresh ? (
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={() => {
							setIsRefreshing(true);
							void onRefresh().finally(() => setIsRefreshing(false));
						}}
					/>
				) : undefined
			}
		>
			{primaryAction ? (
				<FormButton
					label={primaryAction.label}
					onPress={primaryAction.onPress}
					disabled={primaryAction.disabled}
					pending={primaryAction.pending}
					prominent
				/>
			) : null}
			{children}
		</ScrollView>
	);
}

function HeroPart({
	reveal,
	index,
	children,
}: FormRevealProps & { reveal: boolean }) {
	return reveal ? <FormReveal index={index}>{children}</FormReveal> : children;
}

export function FormHero({
	eyebrow,
	title,
	description,
	image,
	reveal = false,
}: FormHeroProps) {
	const { theme } = useColorScheme();

	return (
		<View style={styles.hero}>
			{image ? (
				<HeroPart reveal={reveal} index={0}>
					<Image source={image} style={styles.heroImage} />
				</HeroPart>
			) : null}
			{eyebrow ? (
				<HeroPart reveal={reveal} index={1}>
					<Text style={[styles.eyebrow, { color: theme.primary }]}>
						{eyebrow.toUpperCase()}
					</Text>
				</HeroPart>
			) : null}
			<HeroPart reveal={reveal} index={2}>
				<Text style={[styles.heroTitle, { color: theme.text }]}>{title}</Text>
			</HeroPart>
			<HeroPart reveal={reveal} index={3}>
				<Text style={[styles.body, { color: theme.muted }]}>{description}</Text>
			</HeroPart>
		</View>
	);
}

export function FormSection({ title, footer, children }: FormSectionProps) {
	const { theme } = useColorScheme();

	return (
		<View style={styles.section}>
			{title ? (
				<Text style={[styles.sectionTitle, { color: theme.muted }]}>
					{title}
				</Text>
			) : null}
			<View
				style={[
					styles.sectionBody,
					{ backgroundColor: theme.card, borderColor: theme.border },
				]}
			>
				{children}
			</View>
			{footer ? (
				<Text style={[styles.footnote, { color: theme.muted }]}>{footer}</Text>
			) : null}
		</View>
	);
}

export const FormFields = FormSection;

export function FormRow(props: FormRowProps) {
	return <ListRow {...props} />;
}

/** A kit row that can also stand for a button in flight, with a spinner at its end. */
function ListRow({
	title,
	subtitle,
	value,
	tone = "default",
	onPress,
	showsChevron = false,
	disabled = false,
	pending = false,
	actions,
}: FormRowProps & { pending?: boolean }) {
	const { theme } = useColorScheme();
	const showActions = actions?.length
		? () =>
				Alert.alert(title, undefined, [
					...actions
						.filter((action) => !action.disabled)
						.map(
							(action): AlertButton => ({
								text: action.label,
								style: action.destructive ? "destructive" : "default",
								onPress: () =>
									action.confirm
										? confirm(action.confirm, action.onPress)
										: action.onPress(),
							}),
						),
					{ text: "Cancel", style: "cancel" },
				])
		: undefined;
	const color =
		tone === "destructive"
			? theme.notification
			: tone === "accent"
				? theme.primary
				: theme.text;

	return (
		<Pressable
			accessibilityRole={onPress ? "button" : undefined}
			onPress={onPress}
			onLongPress={showActions}
			disabled={disabled || pending || !(onPress || showActions)}
			accessibilityState={{ disabled: disabled || pending, busy: pending }}
			style={[styles.row, disabled && styles.disabled]}
		>
			<View style={styles.rowCopy}>
				<Text style={[styles.rowTitle, { color }]}>{title}</Text>
				{subtitle ? (
					<Text style={[styles.footnote, { color: theme.muted }]}>
						{subtitle}
					</Text>
				) : null}
			</View>
			{pending ? <ActivityIndicator color={color} /> : null}
			{value ? <Text style={{ color: theme.muted }}>{value}</Text> : null}
			{showsChevron ? <Text style={{ color: theme.muted }}>›</Text> : null}
		</Pressable>
	);
}

export function FormText({
	children,
	variant = "body",
	muted = false,
}: FormTextProps) {
	const { theme } = useColorScheme();

	return (
		<Text
			style={[
				styles.row,
				variant === "headline" ? styles.rowTitle : styles.body,
				variant === "footnote" && styles.footnote,
				{ color: muted ? theme.muted : theme.text },
			]}
		>
			{children}
		</Text>
	);
}

export function FormButton({
	label,
	onPress,
	disabled = false,
	pending = false,
	prominent = false,
}: FormButtonProps) {
	const { theme } = useColorScheme();

	if (prominent) {
		return (
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ disabled: disabled || pending, busy: pending }}
				onPress={onPress}
				disabled={disabled || pending}
				style={[
					styles.prominent,
					{ backgroundColor: theme.primary },
					disabled && styles.disabled,
				]}
			>
				{pending ? <ActivityIndicator color={theme.background} /> : null}
				<Text style={[styles.prominentLabel, { color: theme.background }]}>
					{label}
				</Text>
			</Pressable>
		);
	}

	return (
		<ListRow
			title={label}
			tone="accent"
			onPress={onPress}
			disabled={disabled}
			pending={pending}
		/>
	);
}

export function FormConfirmButton({
	label,
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	disabled = false,
	pending = false,
}: FormConfirmButtonProps) {
	return (
		<ListRow
			title={label}
			tone="destructive"
			disabled={disabled}
			pending={pending}
			onPress={() =>
				confirm({ title, message, confirmLabel, cancelLabel }, onConfirm)
			}
		/>
	);
}

function confirm(
	{ title, message, confirmLabel, cancelLabel = "Cancel" }: FormConfirmation,
	onConfirm: () => void,
) {
	Alert.alert(title, message, [
		{ text: cancelLabel, style: "cancel" },
		{ text: confirmLabel, style: "destructive", onPress: onConfirm },
	]);
}

export function FormLink({ label, destination }: FormLinkProps) {
	return (
		<FormRow
			title={label}
			value={new URL(destination).hostname}
			tone="accent"
			onPress={() => void ExpoLinking.openURL(destination)}
		/>
	);
}

export function FormPhotos({ photos }: FormPhotosProps) {
	const { theme } = useColorScheme();

	return (
		<View style={[styles.row, styles.photos]}>
			{photos.map((photo) => (
				<View key={photo.id} style={styles.photoColumn}>
					<FadeInPhoto
						key={photo.id}
						uri={photo.uri}
						accessibilityLabel={photo.accessibilityLabel}
						style={[styles.photo, { backgroundColor: theme.border }]}
					/>
					<Text style={[styles.footnote, { color: theme.muted }]}>
						{photo.caption}
					</Text>
				</View>
			))}
		</View>
	);
}

const DIVIDER_STEP = 10;

export function FormCompareSlider({ earlier, latest }: FormCompareSliderProps) {
	const { theme } = useColorScheme();
	const [position, setPosition] = useState(50);
	const move = (delta: number) =>
		setPosition((current) => Math.min(100, Math.max(0, current + delta)));
	const caption = [styles.footnote, { color: theme.muted }];

	return (
		<View style={[styles.row, styles.compare]}>
			<ComparedPhotos
				earlier={earlier}
				latest={latest}
				position={position}
				style={[styles.photo, { backgroundColor: theme.border }]}
			/>
			<View style={styles.captions}>
				<Text style={caption}>{earlier.caption}</Text>
				<Text style={caption}>{latest.caption}</Text>
			</View>
			<View
				accessible
				accessibilityRole="adjustable"
				accessibilityLabel="Divider between the earlier and latest photos"
				accessibilityValue={{ min: 0, max: 100, now: position }}
				accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
				onAccessibilityAction={(event) =>
					move(
						event.nativeEvent.actionName === "increment"
							? DIVIDER_STEP
							: -DIVIDER_STEP,
					)
				}
				style={styles.captions}
			>
				<Pressable onPress={() => move(-DIVIDER_STEP)}>
					<Text style={{ color: theme.primary }}>− Earlier</Text>
				</Pressable>
				<Pressable onPress={() => move(DIVIDER_STEP)}>
					<Text style={{ color: theme.primary }}>Latest +</Text>
				</Pressable>
			</View>
		</View>
	);
}

export function FormProgress({ label }: FormProgressProps) {
	const { theme } = useColorScheme();

	return (
		<View style={styles.row}>
			<ActivityIndicator color={theme.primary} />
			<Text style={{ color: theme.muted }}>{label}</Text>
		</View>
	);
}

export function FormTextField({
	placeholder,
	kind,
	onChangeText,
	onSubmit,
}: FormTextFieldProps) {
	const { theme } = useColorScheme();

	return (
		<TextInput
			placeholder={placeholder}
			placeholderTextColor={theme.muted}
			secureTextEntry={kind === "password" || kind === "newPassword"}
			keyboardType={kind === "email" ? "email-address" : "default"}
			autoCapitalize={kind === "name" ? "words" : "none"}
			onChangeText={onChangeText}
			onSubmitEditing={onSubmit}
			style={[styles.row, styles.input, { color: theme.text }]}
		/>
	);
}

export function FormToggle({ label, value, onValueChange }: FormToggleProps) {
	const { theme } = useColorScheme();

	return (
		<View style={styles.row}>
			<Text style={[styles.rowCopy, { color: theme.text }]}>{label}</Text>
			<Switch value={value} onValueChange={onValueChange} />
		</View>
	);
}

export function FormChoice<T extends string>({
	options,
	selection,
	onSelectionChange,
	disabled = false,
	pendingValue,
}: FormChoiceProps<T>) {
	const { theme } = useColorScheme();
	const status = useChoiceStatus(pendingValue, selection);

	return (
		<>
			<View style={[styles.row, styles.choice]}>
				{options.map((option) => {
					const selected = option.value === selection;
					return (
						<Pressable
							key={option.value}
							accessibilityRole="button"
							accessibilityState={{ selected }}
							disabled={disabled || pendingValue !== undefined}
							onPress={() => onSelectionChange(option.value)}
							style={[
								styles.choiceOption,
								{ borderColor: theme.border },
								selected && { backgroundColor: theme.primary },
							]}
						>
							<Text style={{ color: selected ? theme.background : theme.text }}>
								{option.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
			{status === "saving" ? (
				<View style={styles.row}>
					<ActivityIndicator color={theme.muted} />
					<Text style={{ color: theme.muted }}>Saving…</Text>
				</View>
			) : status === "saved" ? (
				<View style={styles.row}>
					<Text style={{ color: theme.success }}>✓</Text>
					<Text style={{ color: theme.muted }}>Saved</Text>
				</View>
			) : null}
		</>
	);
}

export function FormPicker({
	label,
	options,
	selection,
	onSelectionChange,
}: FormPickerProps) {
	const [expanded, setExpanded] = useState(false);
	const selected = options.find((option) => option.value === selection);

	return (
		<>
			<ListRow
				title={label}
				value={selected?.label}
				onPress={() => setExpanded(!expanded)}
			/>
			{expanded
				? options.map((option) => (
						<ListRow
							key={option.value}
							title={option.label}
							value={option.value === selection ? "✓" : undefined}
							disabled={option.disabled}
							onPress={() => {
								setExpanded(false);
								onSelectionChange(option.value);
							}}
						/>
					))
				: null}
		</>
	);
}

export function FormStep({ number, total, text }: FormStepProps) {
	const { theme } = useColorScheme();

	return (
		<View
			accessible
			accessibilityLabel={`Step ${number} of ${total}: ${text}`}
			style={[styles.row, styles.step]}
		>
			<Text style={[styles.stepNumber, { color: theme.primary }]}>
				{String(number).padStart(2, "0")}
			</Text>
			<Text style={[styles.body, styles.rowCopy, { color: theme.text }]}>
				{text}
			</Text>
		</View>
	);
}

export function FormEmptyState({ title, description }: FormEmptyStateProps) {
	const { theme } = useColorScheme();

	return (
		<View style={styles.empty}>
			<Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
			<Text style={[styles.body, styles.center, { color: theme.muted }]}>
				{description}
			</Text>
		</View>
	);
}

export function FormReveal({ children, index = 0 }: FormRevealProps) {
	const motion = useMotion();

	return (
		<Animated.View
			entering={
				motion.reduced
					? undefined
					: FadeInDown.duration(motion.slow)
							.delay(staggerDelay(motion, index))
							.easing(Easing.out(Easing.quad))
							.withInitialValues({ transform: [{ translateY: motion.rise }] })
			}
		>
			{children}
		</Animated.View>
	);
}

export function FormSkeleton({
	shape,
	count = SKELETON_COUNT[shape],
	label,
}: FormSkeletonProps) {
	const { theme } = useColorScheme();
	const block = { backgroundColor: theme.border };
	const slots = Array.from({ length: count }, (_, index) => index);

	return (
		<View accessible accessibilityLabel={label}>
			{shape === "photos" ? (
				<View style={[styles.row, styles.photos]}>
					{slots.map((index) => (
						<View key={index} style={styles.photoColumn}>
							<View style={[styles.photo, block]} />
							<View style={[styles.skeletonLine, styles.short, block]} />
						</View>
					))}
				</View>
			) : shape === "choice" ? (
				<View style={styles.row}>
					<View style={[styles.skeletonChoice, block]} />
				</View>
			) : (
				slots.map((index) => (
					<View key={index} style={styles.row}>
						<View style={[styles.skeletonLine, styles.long, block]} />
					</View>
				))
			)}
		</View>
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
	screen: {
		padding: 16,
		gap: 24,
	},
	hero: {
		gap: 8,
		paddingTop: 16,
	},
	heroImage: {
		width: 64,
		height: 64,
		borderRadius: 15,
		marginBottom: 8,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 1,
	},
	heroTitle: {
		fontSize: 32,
		fontWeight: "700",
	},
	body: {
		fontSize: 16,
		lineHeight: 23,
	},
	section: {
		gap: 6,
	},
	sectionTitle: {
		fontSize: 13,
		paddingHorizontal: 16,
	},
	sectionBody: {
		borderRadius: 12,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},
	footnote: {
		fontSize: 13,
		lineHeight: 18,
		paddingHorizontal: 16,
	},
	row: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	rowCopy: {
		flex: 1,
		gap: 2,
	},
	rowTitle: {
		fontSize: 17,
	},
	disabled: {
		opacity: 0.4,
	},
	prominent: {
		minHeight: 50,
		borderRadius: 12,
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	prominentLabel: {
		fontSize: 17,
		fontWeight: "600",
	},
	photos: {
		alignItems: "flex-start",
	},
	photoColumn: {
		flex: 1,
		gap: 6,
	},
	photo: {
		width: "100%",
		aspectRatio: 4 / 5,
		borderRadius: 12,
	},
	compare: {
		flexDirection: "column",
		alignItems: "stretch",
		gap: 6,
	},
	captions: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	input: {
		fontSize: 17,
	},
	choice: {
		gap: 8,
	},
	choiceOption: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
	},
	skeletonLine: {
		height: 14,
		borderRadius: 4,
	},
	long: {
		width: "70%",
	},
	short: {
		width: "50%",
	},
	skeletonChoice: {
		flex: 1,
		height: 32,
		borderRadius: 8,
	},
	empty: {
		alignItems: "center",
		gap: 8,
		paddingVertical: 32,
	},
	center: {
		textAlign: "center",
	},
	step: {
		alignItems: "flex-start",
	},
	stepNumber: {
		fontSize: 17,
		fontWeight: "600",
		lineHeight: 23,
		fontVariant: ["tabular-nums"],
	},
});
