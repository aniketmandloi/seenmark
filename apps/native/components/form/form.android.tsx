import {
	AlertDialog,
	Box,
	Button,
	Checkbox,
	CircularProgressIndicator,
	Column,
	ExtendedFloatingActionButton,
	Host,
	Icon,
	ListItem,
	OutlinedTextField,
	PullToRefreshBox,
	RNHostView,
	Row,
	SegmentedButton,
	SingleChoiceSegmentedButtonRow,
	Text,
	TextButton,
	type TextFieldKeyboardOptions,
	useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
	align,
	alpha,
	background,
	clickable,
	clip,
	fillMaxSize,
	fillMaxWidth,
	height,
	padding,
	Shapes,
	verticalScroll,
} from "@expo/ui/jetpack-compose/modifiers";
import * as ExpoLinking from "expo-linking";
import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useState,
} from "react";
import {
	Image as RNImage,
	Text as RNText,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";

import type {
	FormButtonProps,
	FormChoiceProps,
	FormConfirmButtonProps,
	FormEmptyStateProps,
	FormFieldsProps,
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
} from "@/components/form/types";
import { ICONS } from "@/lib/icons";
import { useColorScheme } from "@/lib/use-color-scheme";

const TRANSPARENT = "#00000000";
const SCREEN_PADDING = 16;
const ROW_PADDING = 12;
const PHOTO_GAP = 10;

// Sections read their rows by position to round the ends, so fragments must not hide rows.
function flattenRows(children: ReactNode): ReactElement[] {
	const rows: ReactElement[] = [];
	Children.forEach(children, (child) => {
		if (!isValidElement(child)) return;
		if (child.type === Fragment) {
			rows.push(
				...flattenRows((child.props as { children?: ReactNode }).children),
			);
		} else {
			rows.push(child);
		}
	});
	return rows;
}

function rowShape(index: number, count: number) {
	const full = 20;
	const small = 4;
	return Shapes.RoundedCorner({
		topStart: index === 0 ? full : small,
		topEnd: index === 0 ? full : small,
		bottomStart: index === count - 1 ? full : small,
		bottomEnd: index === count - 1 ? full : small,
	});
}

export function FormScreen({
	children,
	primaryAction,
	onRefresh,
}: FormScreenProps) {
	const { colorScheme, theme } = useColorScheme();

	return (
		<Host
			style={styles.fill}
			colorScheme={colorScheme}
			seedColor={theme.primary}
		>
			<ScreenBody primaryAction={primaryAction} onRefresh={onRefresh}>
				{children}
			</ScreenBody>
		</Host>
	);
}

function ScreenBody({ children, primaryAction, onRefresh }: FormScreenProps) {
	const colors = useMaterialColors();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const modifiers = [fillMaxSize(), background(colors.surface)];

	const content = (
		<>
			<Column
				verticalArrangement={{ spacedBy: 24 }}
				modifiers={[
					fillMaxSize(),
					verticalScroll(),
					padding(SCREEN_PADDING, 8, SCREEN_PADDING, primaryAction ? 112 : 32),
				]}
			>
				{children}
			</Column>
			{primaryAction ? (
				<ExtendedFloatingActionButton
					onClick={primaryAction.disabled ? undefined : primaryAction.onPress}
					modifiers={[
						align("bottomEnd"),
						padding(0, 0, SCREEN_PADDING, SCREEN_PADDING),
						...(primaryAction.disabled ? [alpha(0.6)] : []),
					]}
				>
					<ExtendedFloatingActionButton.Icon>
						<Icon source={ICONS[primaryAction.icon].android} />
					</ExtendedFloatingActionButton.Icon>
					<ExtendedFloatingActionButton.Text>
						<Text>{primaryAction.label}</Text>
					</ExtendedFloatingActionButton.Text>
				</ExtendedFloatingActionButton>
			) : null}
		</>
	);

	if (!onRefresh) return <Box modifiers={modifiers}>{content}</Box>;

	return (
		<PullToRefreshBox
			isRefreshing={isRefreshing}
			onRefresh={() => {
				setIsRefreshing(true);
				void onRefresh().finally(() => setIsRefreshing(false));
			}}
			modifiers={modifiers}
		>
			{content}
		</PullToRefreshBox>
	);
}

export function FormHero({
	eyebrow,
	title,
	description,
	image,
}: FormHeroProps) {
	const colors = useMaterialColors();

	return (
		<Column
			verticalArrangement={{ spacedBy: 8 }}
			modifiers={[fillMaxWidth(), padding(8, 16, 8, 0)]}
		>
			{image ? (
				<RNHostView matchContents>
					<View pointerEvents="none" style={styles.heroImageFrame}>
						<RNImage source={image} style={styles.heroImage} />
					</View>
				</RNHostView>
			) : null}
			{eyebrow ? (
				<Text color={colors.primary} style={{ typography: "labelLarge" }}>
					{eyebrow.toUpperCase()}
				</Text>
			) : null}
			<Text color={colors.onSurface} style={{ typography: "headlineLarge" }}>
				{title}
			</Text>
			<Text color={colors.onSurfaceVariant} style={{ typography: "bodyLarge" }}>
				{description}
			</Text>
		</Column>
	);
}

function SectionTitle({ children }: { children: string }) {
	const colors = useMaterialColors();
	return (
		<Text
			color={colors.primary}
			style={{ typography: "titleSmall" }}
			modifiers={[padding(16, 0, 16, 6)]}
		>
			{children}
		</Text>
	);
}

function SectionFooter({ children }: { children: string }) {
	const colors = useMaterialColors();
	return (
		<Text
			color={colors.onSurfaceVariant}
			style={{ typography: "bodySmall" }}
			modifiers={[padding(16, 6, 16, 0)]}
		>
			{children}
		</Text>
	);
}

export function FormSection({ title, footer, children }: FormSectionProps) {
	const colors = useMaterialColors();
	const rows = flattenRows(children);

	return (
		<Column verticalArrangement={{ spacedBy: 2 }} modifiers={[fillMaxWidth()]}>
			{title ? <SectionTitle>{title}</SectionTitle> : null}
			{rows.map((row, index) => (
				<Column
					// biome-ignore lint/suspicious/noArrayIndexKey: rows are positional slots of one section.
					key={index}
					modifiers={[
						fillMaxWidth(),
						clip(rowShape(index, rows.length)),
						background(colors.surfaceContainer),
					]}
				>
					{row}
				</Column>
			))}
			{footer ? <SectionFooter>{footer}</SectionFooter> : null}
		</Column>
	);
}

export function FormFields({ title, footer, children }: FormFieldsProps) {
	return (
		<Column verticalArrangement={{ spacedBy: 12 }} modifiers={[fillMaxWidth()]}>
			{title ? <SectionTitle>{title}</SectionTitle> : null}
			{children}
			{footer ? <SectionFooter>{footer}</SectionFooter> : null}
		</Column>
	);
}

export function FormRow({
	title,
	subtitle,
	value,
	icon,
	thumbnailUri,
	tone = "default",
	onPress,
	showsChevron = false,
	disabled = false,
}: FormRowProps) {
	const colors = useMaterialColors();
	const titleColor =
		tone === "destructive"
			? colors.error
			: tone === "accent"
				? colors.primary
				: colors.onSurface;
	const iconColor =
		tone === "destructive"
			? colors.error
			: tone === "accent"
				? colors.primary
				: colors.onSurfaceVariant;

	return (
		<ListItem
			colors={{ containerColor: TRANSPARENT }}
			modifiers={[
				...(onPress && !disabled ? [clickable(onPress)] : []),
				...(disabled ? [alpha(0.38)] : []),
			]}
		>
			<ListItem.HeadlineContent>
				<Text color={titleColor}>{title}</Text>
			</ListItem.HeadlineContent>
			{subtitle ? (
				<ListItem.SupportingContent>
					<Text color={colors.onSurfaceVariant}>{subtitle}</Text>
				</ListItem.SupportingContent>
			) : null}
			{thumbnailUri ? (
				<ListItem.LeadingContent>
					<RNHostView matchContents>
						<View pointerEvents="none">
							<RNImage
								source={{ uri: thumbnailUri }}
								style={styles.thumbnail}
							/>
						</View>
					</RNHostView>
				</ListItem.LeadingContent>
			) : icon ? (
				<ListItem.LeadingContent>
					<Icon source={ICONS[icon].android} tint={iconColor} size={24} />
				</ListItem.LeadingContent>
			) : null}
			{value || showsChevron ? (
				<ListItem.TrailingContent>
					<Row
						verticalAlignment="center"
						horizontalArrangement={{ spacedBy: 4 }}
					>
						{value ? (
							<Text color={colors.onSurfaceVariant}>{value}</Text>
						) : null}
						{showsChevron ? (
							<Icon
								source={ICONS.chevron.android}
								tint={colors.onSurfaceVariant}
								size={24}
							/>
						) : null}
					</Row>
				</ListItem.TrailingContent>
			) : null}
		</ListItem>
	);
}

export function FormText({
	children,
	variant = "body",
	muted = false,
}: FormTextProps) {
	const colors = useMaterialColors();

	return (
		<Text
			color={muted ? colors.onSurfaceVariant : colors.onSurface}
			style={{
				typography:
					variant === "headline"
						? "titleMedium"
						: variant === "footnote"
							? "bodySmall"
							: "bodyMedium",
			}}
			modifiers={[padding(16, 14, 16, 14)]}
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
	if (prominent) {
		return (
			<Button
				onClick={onPress}
				enabled={!disabled}
				modifiers={[fillMaxWidth(), height(52)]}
			>
				<Text style={{ typography: "labelLarge" }}>{label}</Text>
			</Button>
		);
	}

	return (
		<FormRow
			title={label}
			icon={icon}
			tone="accent"
			onPress={onPress}
			disabled={disabled}
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
	const colors = useMaterialColors();
	const [isPresented, setIsPresented] = useState(false);

	return (
		<>
			<FormRow
				title={label}
				icon={icon}
				tone="destructive"
				onPress={() => setIsPresented(true)}
				disabled={disabled}
			/>
			{isPresented ? (
				<AlertDialog onDismissRequest={() => setIsPresented(false)}>
					<AlertDialog.Title>
						<Text>{title}</Text>
					</AlertDialog.Title>
					<AlertDialog.Text>
						<Text>{message}</Text>
					</AlertDialog.Text>
					<AlertDialog.DismissButton>
						<TextButton onClick={() => setIsPresented(false)}>
							<Text>{cancelLabel}</Text>
						</TextButton>
					</AlertDialog.DismissButton>
					<AlertDialog.ConfirmButton>
						<TextButton
							colors={{ contentColor: colors.error }}
							onClick={() => {
								setIsPresented(false);
								onConfirm();
							}}
						>
							<Text>{confirmLabel}</Text>
						</TextButton>
					</AlertDialog.ConfirmButton>
				</AlertDialog>
			) : null}
		</>
	);
}

export function FormLink({ label, destination }: FormLinkProps) {
	return (
		<FormRow
			title={label}
			icon="external"
			tone="accent"
			onPress={() => void ExpoLinking.openURL(destination)}
		/>
	);
}

export function FormPhotos({ photos }: FormPhotosProps) {
	const colors = useMaterialColors();
	const { width } = useWindowDimensions();
	// Compose has no aspect-ratio modifier, so size from the window like the section around it.
	const rowWidth = width - SCREEN_PADDING * 2 - ROW_PADDING * 2;
	const photoWidth =
		photos.length > 1 ? (rowWidth - PHOTO_GAP) / photos.length : rowWidth;

	return (
		<Column
			modifiers={[padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING)]}
		>
			<RNHostView matchContents>
				<View style={styles.photoRow}>
					{photos.map((photo) => (
						<View key={photo.id} style={{ width: photoWidth }}>
							<RNImage
								source={{ uri: photo.uri }}
								style={[
									styles.photo,
									{
										width: photoWidth,
										height: (photoWidth * 5) / 4,
										borderRadius: photos.length > 1 ? 12 : 16,
									},
								]}
								resizeMode="cover"
								accessibilityLabel={photo.accessibilityLabel}
							/>
							<RNText
								style={[styles.caption, { color: colors.onSurfaceVariant }]}
							>
								{photo.caption}
							</RNText>
						</View>
					))}
				</View>
			</RNHostView>
		</Column>
	);
}

export function FormProgress({ label }: FormProgressProps) {
	const colors = useMaterialColors();

	return (
		<Row
			verticalAlignment="center"
			horizontalArrangement={{ spacedBy: 16 }}
			modifiers={[fillMaxWidth(), padding(16, 16, 16, 16)]}
		>
			<CircularProgressIndicator color={colors.primary} />
			<Text color={colors.onSurfaceVariant}>{label}</Text>
		</Row>
	);
}

const KEYBOARD: Record<FormTextFieldProps["kind"], TextFieldKeyboardOptions> = {
	name: { capitalization: "words", keyboardType: "text" },
	email: {
		capitalization: "none",
		keyboardType: "email",
		autoCorrectEnabled: false,
	},
	password: { keyboardType: "password", autoCorrectEnabled: false },
	newPassword: { keyboardType: "password", autoCorrectEnabled: false },
};

export function FormTextField({
	placeholder,
	kind,
	onChangeText,
	onSubmit,
	submitLabel = "next",
}: FormTextFieldProps) {
	const imeAction = submitLabel === "go" ? "go" : "next";

	return (
		<OutlinedTextField
			singleLine
			visualTransformation={
				kind === "password" || kind === "newPassword" ? "password" : "none"
			}
			keyboardOptions={{ ...KEYBOARD[kind], imeAction }}
			keyboardActions={
				onSubmit
					? imeAction === "go"
						? { onGo: () => onSubmit() }
						: { onNext: () => onSubmit() }
					: undefined
			}
			onValueChange={onChangeText}
			modifiers={[fillMaxWidth()]}
		>
			<OutlinedTextField.Label>
				<Text>{placeholder}</Text>
			</OutlinedTextField.Label>
		</OutlinedTextField>
	);
}

export function FormToggle({ label, value, onValueChange }: FormToggleProps) {
	const colors = useMaterialColors();

	return (
		<Row
			verticalAlignment="center"
			modifiers={[
				fillMaxWidth(),
				clip(Shapes.RoundedCorner(12)),
				clickable(() => onValueChange(!value)),
				padding(0, 2, 12, 2),
			]}
		>
			<Checkbox value={value} onCheckedChange={onValueChange} />
			<Text color={colors.onSurface} style={{ typography: "bodyLarge" }}>
				{label}
			</Text>
		</Row>
	);
}

export function FormChoice<T extends string>({
	options,
	selection,
	onSelectionChange,
	disabled = false,
}: FormChoiceProps<T>) {
	return (
		<SingleChoiceSegmentedButtonRow
			modifiers={[
				fillMaxWidth(),
				padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING),
			]}
		>
			{options.map((option) => (
				<SegmentedButton
					key={option.value}
					selected={selection === option.value}
					enabled={!disabled}
					onClick={() => onSelectionChange(option.value)}
				>
					<SegmentedButton.Label>
						<Text>{option.label}</Text>
					</SegmentedButton.Label>
				</SegmentedButton>
			))}
		</SingleChoiceSegmentedButtonRow>
	);
}

export function FormEmptyState({
	icon,
	title,
	description,
}: FormEmptyStateProps) {
	const colors = useMaterialColors();

	return (
		<Column
			horizontalAlignment="center"
			verticalArrangement={{ spacedBy: 8 }}
			modifiers={[fillMaxWidth(), padding(24, 32, 24, 8)]}
		>
			<Icon source={ICONS[icon].android} tint={colors.primary} size={48} />
			<Text
				color={colors.onSurface}
				style={{ typography: "titleLarge", textAlign: "center" }}
			>
				{title}
			</Text>
			<Text
				color={colors.onSurfaceVariant}
				style={{ typography: "bodyMedium", textAlign: "center" }}
			>
				{description}
			</Text>
		</Column>
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
		borderRadius: 16,
	},
	thumbnail: {
		width: 44,
		height: 55,
		borderRadius: 8,
		backgroundColor: "#D8D8D0",
	},
	photoRow: {
		flexDirection: "row",
		gap: PHOTO_GAP,
	},
	photo: {
		backgroundColor: "#D8D8D0",
	},
	caption: {
		fontSize: 12,
		marginTop: 6,
	},
});
