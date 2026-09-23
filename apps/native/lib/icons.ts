import type { Image as SwiftUIImage } from "@expo/ui/swift-ui";
import type { ComponentProps } from "react";
import type { ImageSourcePropType } from "react-native";

type SFSymbol = NonNullable<ComponentProps<typeof SwiftUIImage>["systemName"]>;

type PlatformIcon = { ios: SFSymbol; android: ImageSourcePropType };

// Android vectors are Material Icons (Apache 2.0); Compose's parser reads plain <path> elements only.
export const ICONS = {
	account: {
		ios: "person.crop.circle",
		android: require("@/assets/icons/account_circle.xml"),
	},
	camera: {
		ios: "camera",
		android: require("@/assets/icons/photo_camera.xml"),
	},
	chevron: {
		ios: "chevron.right",
		android: require("@/assets/icons/chevron_right.xml"),
	},
	delete: { ios: "trash", android: require("@/assets/icons/delete.xml") },
	done: {
		ios: "checkmark.circle.fill",
		android: require("@/assets/icons/check_circle.xml"),
	},
	error: {
		ios: "exclamationmark.triangle.fill",
		android: require("@/assets/icons/error.xml"),
	},
	external: {
		ios: "arrow.up.right.square",
		android: require("@/assets/icons/open_in_new.xml"),
	},
	info: { ios: "info.circle", android: require("@/assets/icons/info.xml") },
	privacy: {
		ios: "lock.shield.fill",
		android: require("@/assets/icons/lock.xml"),
	},
	reminder: {
		ios: "bell.badge",
		android: require("@/assets/icons/notifications.xml"),
	},
	signOut: {
		ios: "rectangle.portrait.and.arrow.right",
		android: require("@/assets/icons/logout.xml"),
	},
	steps: {
		ios: "list.number",
		android: require("@/assets/icons/format_list_numbered.xml"),
	},
} satisfies Record<string, PlatformIcon>;

export type IconName = keyof typeof ICONS;
