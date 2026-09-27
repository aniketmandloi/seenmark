import {
	AlertDialog,
	AnimatedVisibility,
	Box,
	Button,
	Checkbox,
	CircularProgressIndicator,
	Column,
	DropdownMenu,
	DropdownMenuItem,
	EnterTransition,
	ExitTransition,
	ExposedDropdownMenu,
	ExposedDropdownMenuBox,
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
	Slider,
	SnackbarHost,
	type SnackbarHostRef,
	Text,
	TextButton,
	type TextFieldKeyboardOptions,
	useMaterialColors,
} from "@expo/ui/jetpack-compose";
import {
	align,
	alpha,
	animated,
	background,
	clickable,
	clip,
	combinedClickable,
	fillMaxSize,
	fillMaxWidth,
	graphicsLayer,
	height,
	type ModifierConfig,
	menuAnchor,
	onGloballyPositioned,
	padding,
	Shapes,
	size,
	verticalScroll,
	weight,
} from "@expo/ui/jetpack-compose/modifiers";
import * as ExpoLinking from "expo-linking";
import { useFocusEffect } from "expo-router";
import {
	Children,
	Fragment,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useRef,
	useState,
} from "react";
import {
	Image as RNImage,
	Text as RNText,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";

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
	FormFieldsProps,
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
} from "@/components/form/types";
import { SKELETON_COUNT } from "@/components/form/types";
import { enter } from "@/lib/compose-motion";
import { showResultsIn } from "@/lib/feedback";
import { ICONS } from "@/lib/icons";
import { staggerDelay, useMotion } from "@/lib/motion";
import { useColorScheme } from "@/lib/use-color-scheme";

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
					onClick={
						primaryAction.disabled || primaryAction.pending
							? undefined
							: primaryAction.onPress
					}
					modifiers={[
						align("bottomEnd"),
						padding(0, 0, SCREEN_PADDING, SCREEN_PADDING),
						...(primaryAction.disabled || primaryAction.pending
							? [alpha(0.6)]
							: []),
					]}
				>
					<ExtendedFloatingActionButton.Icon>
						{primaryAction.pending ? (
							<Spinner color={colors.onPrimaryContainer} />
						) : (
							<Icon source={ICONS[primaryAction.icon].android} />
						)}
					</ExtendedFloatingActionButton.Icon>
					<ExtendedFloatingActionButton.Text>
						<Text>{primaryAction.label}</Text>
					</ExtendedFloatingActionButton.Text>
				</ExtendedFloatingActionButton>
			) : null}
			<ResultHost aboveAction={Boolean(primaryAction)} />
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

/** Shows notifyResult messages while this screen is in front, above its action button. */
function ResultHost({ aboveAction }: { aboveAction: boolean }) {
	const host = useRef<SnackbarHostRef>(null);

	useFocusEffect(
		useCallback(
			() =>
				showResultsIn((message) => {
					void host.current?.showSnackbar({ message });
				}),
			[],
		),
	);

	return (
		<SnackbarHost
			ref={host}
			modifiers={[
				align("bottomCenter"),
				padding(SCREEN_PADDING, 0, SCREEN_PADDING, aboveAction ? 88 : 16),
			]}
		/>
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

export function FormRow(props: FormRowProps) {
	return <ListRow {...props} />;
}

function Spinner({ color }: { color: string }) {
	return (
		<CircularProgressIndicator
			color={color}
			strokeWidth={2}
			modifiers={[size(18, 18)]}
		/>
	);
}

/** A kit row that can also stand for a button in flight, with a spinner at its end. */
function ListRow({
	title,
	subtitle,
	value,
	icon,
	tone = "default",
	onPress,
	showsChevron = false,
	disabled = false,
	pending = false,
	actions,
}: FormRowProps & { pending?: boolean }) {
	const colors = useMaterialColors();
	const [menuExpanded, setMenuExpanded] = useState(false);
	const [confirming, setConfirming] = useState<FormRowAction | null>(null);
	const pressable = !disabled && !pending;
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

	const gesture =
		pressable && actions?.length
			? [
					combinedClickable({
						onClick: onPress,
						onLongClick: () => setMenuExpanded(true),
					}),
				]
			: pressable && onPress
				? [clickable(onPress)]
				: [];

	const item = (
		<ListItem
			colors={{ containerColor: "transparent" }}
			modifiers={[...gesture, ...(disabled ? [alpha(0.38)] : [])]}
		>
			<ListItem.HeadlineContent>
				<Text color={titleColor}>{title}</Text>
			</ListItem.HeadlineContent>
			{subtitle ? (
				<ListItem.SupportingContent>
					<Text color={colors.onSurfaceVariant}>{subtitle}</Text>
				</ListItem.SupportingContent>
			) : null}
			{icon ? (
				<ListItem.LeadingContent>
					<Icon source={ICONS[icon].android} tint={iconColor} size={24} />
				</ListItem.LeadingContent>
			) : null}
			{value || showsChevron || pending ? (
				<ListItem.TrailingContent>
					<Row
						verticalAlignment="center"
						horizontalArrangement={{ spacedBy: 4 }}
					>
						{pending ? <Spinner color={iconColor} /> : null}
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

	if (!actions?.length) return item;

	return (
		<>
			<DropdownMenu
				expanded={menuExpanded}
				onDismissRequest={() => setMenuExpanded(false)}
				modifiers={[fillMaxWidth()]}
			>
				<DropdownMenu.Trigger>{item}</DropdownMenu.Trigger>
				<DropdownMenu.Items>
					{actions.map((action) => (
						<DropdownMenuItem
							key={action.label}
							enabled={!action.disabled}
							elementColors={
								action.destructive
									? { textColor: colors.error, leadingIconColor: colors.error }
									: undefined
							}
							onClick={() => {
								setMenuExpanded(false);
								if (action.confirm) setConfirming(action);
								else action.onPress();
							}}
						>
							<DropdownMenuItem.Text>
								<Text>{action.label}</Text>
							</DropdownMenuItem.Text>
							{action.icon ? (
								<DropdownMenuItem.LeadingIcon>
									<Icon source={ICONS[action.icon].android} />
								</DropdownMenuItem.LeadingIcon>
							) : null}
						</DropdownMenuItem>
					))}
				</DropdownMenu.Items>
			</DropdownMenu>
			{confirming?.confirm ? (
				<ConfirmDialog
					{...confirming.confirm}
					onConfirm={confirming.onPress}
					onDismiss={() => setConfirming(null)}
				/>
			) : null}
		</>
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
	pending = false,
	prominent = false,
}: FormButtonProps) {
	const colors = useMaterialColors();

	if (prominent) {
		return (
			<Button
				onClick={onPress}
				enabled={!disabled && !pending}
				modifiers={[fillMaxWidth(), height(52)]}
			>
				<Row verticalAlignment="center" horizontalArrangement={{ spacedBy: 8 }}>
					{pending ? <Spinner color={colors.onSurfaceVariant} /> : null}
					<Text style={{ typography: "labelLarge" }}>{label}</Text>
				</Row>
			</Button>
		);
	}

	return (
		<ListRow
			title={label}
			icon={icon}
			tone="accent"
			onPress={onPress}
			disabled={disabled}
			pending={pending}
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
	const [isPresented, setIsPresented] = useState(false);

	return (
		<>
			<ListRow
				title={label}
				icon={icon}
				tone="destructive"
				onPress={() => setIsPresented(true)}
				disabled={disabled}
				pending={pending}
			/>
			{isPresented ? (
				<ConfirmDialog
					title={title}
					message={message}
					confirmLabel={confirmLabel}
					cancelLabel={cancelLabel}
					onConfirm={onConfirm}
					onDismiss={() => setIsPresented(false)}
				/>
			) : null}
		</>
	);
}

/** A destructive confirmation; the caller renders it only while it is shown. */
function ConfirmDialog({
	title,
	message,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	onDismiss,
}: FormConfirmation & { onConfirm: () => void; onDismiss: () => void }) {
	const colors = useMaterialColors();

	return (
		<AlertDialog onDismissRequest={onDismiss}>
			<AlertDialog.Title>
				<Text>{title}</Text>
			</AlertDialog.Title>
			<AlertDialog.Text>
				<Text>{message}</Text>
			</AlertDialog.Text>
			<AlertDialog.DismissButton>
				<TextButton onClick={onDismiss}>
					<Text>{cancelLabel}</Text>
				</TextButton>
			</AlertDialog.DismissButton>
			<AlertDialog.ConfirmButton>
				<TextButton
					colors={{ contentColor: colors.error }}
					onClick={() => {
						onDismiss();
						onConfirm();
					}}
				>
					<Text>{confirmLabel}</Text>
				</TextButton>
			</AlertDialog.ConfirmButton>
		</AlertDialog>
	);
}

export function FormLink({ label, destination }: FormLinkProps) {
	return (
		<FormRow
			title={label}
			value={new URL(destination).hostname}
			icon="external"
			tone="accent"
			onPress={() => void ExpoLinking.openURL(destination)}
		/>
	);
}

// Compose has no aspect-ratio modifier, so photos size from the window like the section around them.
function usePhotoWidth(count: number) {
	const { width } = useWindowDimensions();
	const rowWidth = width - SCREEN_PADDING * 2 - ROW_PADDING * 2;
	return count > 1 ? (rowWidth - PHOTO_GAP * (count - 1)) / count : rowWidth;
}

export function FormPhotos({ photos }: FormPhotosProps) {
	const colors = useMaterialColors();
	const photoWidth = usePhotoWidth(photos.length);

	return (
		<Column
			modifiers={[padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING)]}
		>
			<RNHostView matchContents>
				<View style={styles.photoRow}>
					{photos.map((photo) => (
						<View key={photo.id} style={{ width: photoWidth }}>
							<FadeInPhoto
								key={photo.id}
								uri={photo.uri}
								accessibilityLabel={photo.accessibilityLabel}
								style={{
									width: photoWidth,
									height: (photoWidth * 5) / 4,
									borderRadius: photos.length > 1 ? 12 : 16,
									backgroundColor: colors.surfaceContainerHighest,
								}}
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

export function FormCompareSlider({ earlier, latest }: FormCompareSliderProps) {
	const colors = useMaterialColors();
	const photoWidth = usePhotoWidth(1);
	const [position, setPosition] = useState(50);
	const captionStyle = [styles.caption, { color: colors.onSurfaceVariant }];

	// Compose's slider takes no content description here, and TalkBack reads text drawn at
	// zero alpha, so the label rides on an invisible Text just ahead of the slider.
	return (
		<Column
			modifiers={[padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING)]}
		>
			<RNHostView matchContents>
				<View style={{ width: photoWidth }}>
					<ComparedPhotos
						earlier={earlier}
						latest={latest}
						position={position}
						style={{
							width: photoWidth,
							height: (photoWidth * 5) / 4,
							borderRadius: 16,
							backgroundColor: colors.surfaceContainerHighest,
						}}
					/>
					<View style={styles.captions}>
						<RNText style={captionStyle}>{earlier.caption}</RNText>
						<RNText style={captionStyle}>{latest.caption}</RNText>
					</View>
				</View>
			</RNHostView>
			<Box modifiers={[fillMaxWidth(), padding(0, 6, 0, 0)]}>
				<Text modifiers={[align("center"), alpha(0)]}>
					Divider between the earlier and latest photos
				</Text>
				<Row
					verticalAlignment="center"
					horizontalArrangement={{ spacedBy: 12 }}
					modifiers={[fillMaxWidth()]}
				>
					<Text
						color={colors.onSurfaceVariant}
						style={{ typography: "bodySmall" }}
					>
						Earlier
					</Text>
					<Slider
						value={position}
						min={0}
						max={100}
						onValueChange={setPosition}
						modifiers={[weight(1)]}
					/>
					<Text
						color={colors.onSurfaceVariant}
						style={{ typography: "bodySmall" }}
					>
						Latest
					</Text>
				</Row>
			</Box>
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
	pendingValue,
}: FormChoiceProps<T>) {
	const status = useChoiceStatus(pendingValue, selection);

	return (
		<Column
			modifiers={[
				fillMaxWidth(),
				padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING),
			]}
		>
			<SingleChoiceSegmentedButtonRow modifiers={[fillMaxWidth()]}>
				{options.map((option) => (
					<SegmentedButton
						key={option.value}
						selected={selection === option.value}
						enabled={!disabled && pendingValue === undefined}
						onClick={() => onSelectionChange(option.value)}
					>
						<SegmentedButton.Label>
							<Text>{option.label}</Text>
						</SegmentedButton.Label>
					</SegmentedButton>
				))}
			</SingleChoiceSegmentedButtonRow>
			<ChoiceStatusRow status={status} />
		</Column>
	);
}

/** A segmented button can't hold a spinner, so a save shows in a line under the row. */
function ChoiceStatusRow({ status }: { status: ChoiceStatus | null }) {
	const colors = useMaterialColors();
	const motion = useMotion();
	const { theme } = useColorScheme();
	const statusLine = (icon: ReactNode, label: string) => (
		<Row
			verticalAlignment="center"
			horizontalArrangement={{ spacedBy: 8 }}
			modifiers={[padding(4, 10, 4, 0)]}
		>
			{icon}
			<Text color={colors.onSurfaceVariant} style={{ typography: "bodySmall" }}>
				{label}
			</Text>
		</Row>
	);
	const saved = statusLine(
		<Icon source={ICONS.done.android} tint={theme.success} size={18} />,
		"Saved",
	);

	// AnimatedVisibility takes no animation spec to snap, so under reduced motion it is skipped.
	return (
		<>
			{status === "saving"
				? statusLine(<Spinner color={colors.onSurfaceVariant} />, "Saving…")
				: null}
			{motion.reduced ? (
				status === "saved" ? (
					saved
				) : null
			) : (
				<AnimatedVisibility
					visible={status === "saved"}
					enterTransition={EnterTransition.fadeIn().plus(
						EnterTransition.scaleIn({ initialScale: 0.9 }),
					)}
					exitTransition={ExitTransition.fadeOut().plus(
						ExitTransition.shrinkVertically(),
					)}
				>
					{saved}
				</AnimatedVisibility>
			)}
		</>
	);
}

export function FormPicker({
	label,
	options,
	selection,
	onSelectionChange,
}: FormPickerProps) {
	const colors = useMaterialColors();
	const [expanded, setExpanded] = useState(false);
	const selected = options.find((option) => option.value === selection);

	return (
		<ExposedDropdownMenuBox
			expanded={expanded}
			onExpandedChange={setExpanded}
			modifiers={[fillMaxWidth()]}
		>
			<ListItem
				colors={{ containerColor: "transparent" }}
				modifiers={[menuAnchor("primaryNotEditable")]}
			>
				<ListItem.HeadlineContent>
					<Text color={colors.onSurface}>{label}</Text>
				</ListItem.HeadlineContent>
				{selected ? (
					<ListItem.TrailingContent>
						<Text color={colors.onSurfaceVariant}>{selected.label}</Text>
					</ListItem.TrailingContent>
				) : null}
			</ListItem>
			<ExposedDropdownMenu
				expanded={expanded}
				onDismissRequest={() => setExpanded(false)}
			>
				{options.map((option) => (
					<DropdownMenuItem
						key={option.value}
						enabled={!option.disabled}
						onClick={() => {
							setExpanded(false);
							onSelectionChange(option.value);
						}}
					>
						<DropdownMenuItem.Text>
							<Text>{option.label}</Text>
						</DropdownMenuItem.Text>
					</DropdownMenuItem>
				))}
			</ExposedDropdownMenu>
		</ExposedDropdownMenuBox>
	);
}

export function FormStep({ number, total, text }: FormStepProps) {
	const colors = useMaterialColors();

	// Compose here can't hide text from TalkBack, so React Native draws the number and hides it
	// there, and "Step 1 of 3:" rides on an invisible Text ahead of the step.
	return (
		<ListItem colors={{ containerColor: "transparent" }}>
			<ListItem.LeadingContent>
				<RNHostView matchContents>
					<View importantForAccessibility="no-hide-descendants">
						<RNText style={[styles.stepNumber, { color: colors.primary }]}>
							{String(number).padStart(2, "0")}
						</RNText>
					</View>
				</RNHostView>
			</ListItem.LeadingContent>
			<ListItem.HeadlineContent>
				<Box>
					<Text modifiers={[alpha(0)]}>{`Step ${number} of ${total}:`}</Text>
					<Text color={colors.onSurface}>{text}</Text>
				</Box>
			</ListItem.HeadlineContent>
		</ListItem>
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

export function FormReveal({ children, index = 0 }: FormRevealProps) {
	const motion = useMotion();
	const [appeared, setAppeared] = useState(motion.reduced);
	const spec = enter(motion, motion.slow, staggerDelay(motion, index));

	// animateFloatAsState starts from the first value it composes, so the flip waits for the
	// first layout rather than a mount effect that can reach Compose before it draws.
	// graphicsLayer moves only the drawn layer, so the rows around never shift.
	return (
		<Column
			modifiers={[
				graphicsLayer({
					alpha: animated(appeared ? 1 : 0, spec),
					translationY: animated(appeared ? 0 : motion.rise, spec),
				}),
				...(appeared ? [] : [onGloballyPositioned(() => setAppeared(true))]),
			]}
		>
			{children}
		</Column>
	);
}

function Placeholder({ modifiers }: { modifiers: ModifierConfig[] }) {
	const colors = useMaterialColors();
	return (
		<Box
			modifiers={[...modifiers, background(colors.surfaceContainerHighest)]}
		/>
	);
}

const line = (fraction: number, lineHeight = 14) => [
	fillMaxWidth(fraction),
	height(lineHeight),
	clip(Shapes.RoundedCorner(4)),
];

/** Static blocks in the shape of the content, so it lands where they stood. */
export function FormSkeleton({
	shape,
	count = SKELETON_COUNT[shape],
	label,
}: FormSkeletonProps) {
	const photoWidth = usePhotoWidth(count);
	const slots = Array.from({ length: count }, (_, index) => index);

	const blocks =
		shape === "photos" ? (
			<Row
				horizontalArrangement={{ spacedBy: PHOTO_GAP }}
				modifiers={[
					padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING),
				]}
			>
				{slots.map((index) => (
					<Column key={index} verticalArrangement={{ spacedBy: 6 }}>
						<Placeholder
							modifiers={[
								size(photoWidth, (photoWidth * 5) / 4),
								clip(Shapes.RoundedCorner(count > 1 ? 12 : 16)),
							]}
						/>
						<Placeholder
							modifiers={[
								size(photoWidth * 0.6, 12),
								clip(Shapes.RoundedCorner(4)),
							]}
						/>
					</Column>
				))}
			</Row>
		) : shape === "choice" ? (
			<Box
				modifiers={[
					fillMaxWidth(),
					padding(ROW_PADDING, ROW_PADDING, ROW_PADDING, ROW_PADDING),
				]}
			>
				<Placeholder
					modifiers={[
						fillMaxWidth(),
						height(40),
						clip(Shapes.RoundedCorner(20)),
					]}
				/>
			</Box>
		) : (
			<Column modifiers={[fillMaxWidth()]}>
				{slots.map((index) =>
					shape === "rows" ? (
						<Row
							key={index}
							verticalAlignment="center"
							horizontalArrangement={{ spacedBy: 16 }}
							modifiers={[fillMaxWidth(), padding(16, 18, 24, 18)]}
						>
							<Placeholder
								modifiers={[size(24, 24), clip(Shapes.RoundedCorner(12))]}
							/>
							<Placeholder modifiers={line(0.6, 16)} />
						</Row>
					) : (
						<Row
							key={index}
							verticalAlignment="top"
							horizontalArrangement={{ spacedBy: 16 }}
							modifiers={[fillMaxWidth(), padding(16, 14, 24, 14)]}
						>
							<Placeholder
								modifiers={[size(20, 16), clip(Shapes.RoundedCorner(4))]}
							/>
							<Column
								verticalArrangement={{ spacedBy: 8 }}
								modifiers={[weight(1)]}
							>
								<Placeholder modifiers={line(1)} />
								<Placeholder modifiers={line(0.7)} />
							</Column>
						</Row>
					),
				)}
			</Column>
		);

	// Compose here has no content description for a plain block, but TalkBack still reads
	// text drawn at zero alpha, so the label rides on an invisible Text over the blocks.
	return (
		<Box modifiers={[fillMaxWidth()]}>
			{blocks}
			<Text modifiers={[align("center"), alpha(0)]}>{label}</Text>
		</Box>
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
		borderRadius: 16,
	},
	photoRow: {
		flexDirection: "row",
		gap: PHOTO_GAP,
	},
	caption: {
		fontSize: 12,
		marginTop: 6,
	},
	// Material 3 titleMedium, with tabular digits.
	stepNumber: {
		fontSize: 16,
		lineHeight: 24,
		fontWeight: "500",
		letterSpacing: 0.15,
		fontVariant: ["tabular-nums"],
	},
	captions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: PHOTO_GAP,
	},
});
