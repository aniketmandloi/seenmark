import { createModifier, type Shape } from "@expo/ui/swift-ui/modifiers";

// Expo Go ships an older Expo UI whose foregroundStyle, background, and tint read their own flat
// fields, and it drops the ShapeStyle the installed version sends without a trace. Sending both
// keeps the color in Expo Go and in a development build.

type Hierarchy = "primary" | "secondary" | "tertiary" | "quaternary";

/** A solid color, or a level of the inherited foreground, for text and symbols. */
export const foreground = (
	paint: string | { type: "hierarchical"; style: Hierarchy },
) =>
	typeof paint === "string"
		? createModifier("foregroundStyle", {
				styleType: "color",
				color: paint,
				style: { type: "color", color: paint },
			})
		: createModifier("foregroundStyle", {
				styleType: "hierarchical",
				hierarchicalStyle: paint.style,
				style: { type: "hierarchical", hierarchical: paint.style },
			});

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
