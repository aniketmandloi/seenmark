import * as ExpoLinking from "expo-linking";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
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

import type {
	FormButtonProps,
	FormChoiceProps,
	FormConfirmButtonProps,
	FormEmptyStateProps,
	FormErrorStateProps,
	FormHeroProps,
	FormLinkProps,
	FormPhotosProps,
	FormProgressProps,
	FormRevealProps,
	FormRowProps,
	FormScreenProps,
	FormSectionProps,
	FormSkeletonProps,
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
					prominent
				/>
			) : null}
			{children}
		</ScrollView>
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
		<View style={styles.hero}>
			{image ? <Image source={image} style={styles.heroImage} /> : null}
			{eyebrow ? (
				<Text style={[styles.eyebrow, { color: theme.primary }]}>
					{eyebrow.toUpperCase()}
				</Text>
			) : null}
			<Text style={[styles.heroTitle, { color: theme.text }]}>{title}</Text>
			<Text style={[styles.body, { color: theme.muted }]}>{description}</Text>
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
}: FormRowProps & { pending?: boolean }) {
	const { theme } = useColorScheme();
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
			disabled={disabled || pending || !onPress}
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
				Alert.alert(title, message, [
					{ text: cancelLabel, style: "cancel" },
					{ text: confirmLabel, style: "destructive", onPress: onConfirm },
				])
			}
		/>
	);
}

export function FormLink({ label, destination }: FormLinkProps) {
	return (
		<FormRow
			title={label}
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
					<Image
						source={{ uri: photo.uri }}
						style={styles.photo}
						accessibilityLabel={photo.accessibilityLabel}
					/>
					<Text style={[styles.footnote, { color: theme.muted }]}>
						{photo.caption}
					</Text>
				</View>
			))}
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
}: FormChoiceProps<T>) {
	const { theme } = useColorScheme();

	return (
		<View style={[styles.row, styles.choice]}>
			{options.map((option) => {
				const selected = option.value === selection;
				return (
					<Pressable
						key={option.value}
						accessibilityRole="button"
						accessibilityState={{ selected }}
						disabled={disabled}
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
});
