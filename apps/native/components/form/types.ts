import type { ReactNode } from "react";
import type { ImageSourcePropType } from "react-native";

import type { IconName } from "@/lib/icons";

export type Tone = "default" | "accent" | "destructive";

export type FormScreenProps = {
	children: ReactNode;
	onRefresh?: () => Promise<void>;
	/** iOS: a navigation bar button. Android: an extended floating action button. */
	primaryAction?: {
		label: string;
		icon: IconName;
		onPress: () => void;
		disabled?: boolean;
		/** Disabled while the action is in flight; Android also shows a spinner in the button. */
		pending?: boolean;
	};
};

export type FormHeroProps = {
	eyebrow?: string;
	title: string;
	description: string;
	image?: ImageSourcePropType;
	/** Staggers the image, eyebrow, title, and description in as reveals 0–3, on first mount only. */
	reveal?: boolean;
};

export type FormSectionProps = {
	title?: string;
	footer?: string;
	children: ReactNode;
};

/** A section of inputs; Android lays these out bare instead of inside list rows. */
export type FormFieldsProps = FormSectionProps;

export type FormRowAction = {
	label: string;
	icon?: IconName;
	disabled?: boolean;
	destructive?: boolean;
	/** Asked first, in the same native dialog as FormConfirmButton; onPress runs once confirmed. */
	confirm?: FormConfirmation;
	onPress: () => void;
};

export type FormRowProps = {
	title: string;
	subtitle?: string;
	value?: string;
	icon?: IconName;
	tone?: Tone;
	onPress?: () => void;
	showsChevron?: boolean;
	disabled?: boolean;
	/** iOS: a context menu. Android and the fallback: a long press. */
	actions?: FormRowAction[];
};

export type FormTextProps = {
	children: string;
	variant?: "headline" | "body" | "footnote";
	muted?: boolean;
};

export type FormButtonProps = {
	label: string;
	onPress: () => void;
	icon?: IconName;
	disabled?: boolean;
	/** Disabled with an inline spinner; the label passed in still names the action in flight. */
	pending?: boolean;
	/** A full-width filled button that ends a flow, like submitting a form. */
	prominent?: boolean;
};

export type FormConfirmButtonProps = {
	label: string;
	icon?: IconName;
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	disabled?: boolean;
	/** Disabled with an inline spinner; the label passed in still names the action in flight. */
	pending?: boolean;
};

export type FormConfirmation = Pick<
	FormConfirmButtonProps,
	"title" | "message" | "confirmLabel" | "cancelLabel"
>;

/** A link out of the app, showing the host it opens beside its label. */
export type FormLinkProps = {
	label: string;
	destination: string;
};

export type FormPhoto = {
	id: string;
	uri: string;
	/** Everything a screen reader hears about the photo; the caption is hidden from it. */
	accessibilityLabel: string;
	caption: string;
};

export type FormPhotosProps = {
	/** One photo fills the row; two sit side by side. */
	photos: FormPhoto[];
};

export type FormCompareSliderProps = { earlier: FormPhoto; latest: FormPhoto };

export type FormProgressProps = {
	label: string;
};

export type FormTextFieldProps = {
	placeholder: string;
	kind: "name" | "email" | "password" | "newPassword";
	onChangeText: (value: string) => void;
	onSubmit?: () => void;
	submitLabel?: "next" | "go";
};

export type FormToggleProps = {
	label: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
};

export type FormChoiceProps<T extends string> = {
	options: readonly { value: T; label: string }[];
	selection: T | null;
	onSelectionChange: (value: T) => void;
	disabled?: boolean;
	/**
	 * The value being saved: the control is disabled with "Saving…" under it. Clear it only once
	 * the save has settled; if `selection` then holds that value, "Saved" shows for a moment, and
	 * a failed save that rolled `selection` back ends quietly.
	 */
	pendingValue?: T;
};

export type FormPickerProps = {
	label: string;
	options: { value: string; label: string; disabled?: boolean }[];
	selection: string;
	onSelectionChange: (value: string) => void;
};

/** One step of a numbered list, shown as "01"; screen readers hear "Step 1 of 3: …" instead. */
export type FormStepProps = {
	number: number;
	total: number;
	text: string;
};

export type FormRevealProps = {
	children: ReactNode;
	/** Position among the reveals on screen; each step starts one stagger later. */
	index?: number;
};

export type FormSkeletonShape = "rows" | "photos" | "choice" | "steps";

export type FormSkeletonProps = {
	/** The content it stands in for, drawn static in the same shape. */
	shape: FormSkeletonShape;
	count?: number;
	/** Read by screen readers in place of the placeholder, like "Loading your photos". */
	label: string;
};

export const SKELETON_COUNT: Record<FormSkeletonShape, number> = {
	rows: 3,
	photos: 2,
	choice: 3,
	steps: 3,
};

export type FormErrorStateProps = {
	/** What failed to load, like "Your check-ins could not load." */
	message: string;
	footer?: string;
	retrying: boolean;
	onRetry: () => void;
};

export type FormEmptyStateProps = {
	icon: IconName;
	title: string;
	description: string;
};
