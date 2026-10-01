import { createModifier, type Shape } from "@expo/ui/swift-ui/modifiers";

// Expo Go ships an older Expo UI whose background and tint read a plain `color`, and it drops the
// ShapeStyle the installed version sends without a trace. Sending both keeps the color in Expo Go
// and in a development build.

/** A solid fill behind the view, in `shape` if given. */
export const fill = (color: string, shape?: Shape) =>
	createModifier("background", {
		color,
		style: { type: "color", color },
		...shape,
	});

/** A solid tint for the view's controls. */
export const tintColor = (color: string) =>
	createModifier("tint", { color, tint: { type: "color", color } });
