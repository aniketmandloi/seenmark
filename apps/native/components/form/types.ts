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
	};
};

export type FormHeroProps = {
	eyebrow?: string;
	title: string;
	description: string;
	image?: ImageSourcePropType;
};

export type FormSectionProps = {
	title?: string;
	footer?: string;
	children: ReactNode;
};

/** A section of inputs; Android lays these out bare instead of inside list rows. */
export type FormFieldsProps = FormSectionProps;

export type FormRowProps = {
	title: string;
	subtitle?: string;
	value?: string;
	icon?: IconName;
	tone?: Tone;
	onPress?: () => void;
	showsChevron?: boolean;
	disabled?: boolean;
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
};

export type FormLinkProps = {
	label: string;
	destination: string;
};

export type FormPhoto = {
	id: string;
	uri: string;
	accessibilityLabel: string;
	caption: string;
};

export type FormPhotosProps = {
	/** One photo fills the row; two sit side by side. */
	photos: FormPhoto[];
};

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
};

export type FormEmptyStateProps = {
	icon: IconName;
	title: string;
	description: string;
};
