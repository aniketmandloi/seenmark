import {
	Animation,
	animation,
	type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";

import type { Motion } from "@/lib/motion";

/**
 * Eases the modifiers before it out when `value` changes, over `duration` ms. SwiftUI's
 * animation ignores Reduce Motion, so under it this adds no animation at all.
 */
export function easeOut(
	motion: Motion,
	duration: number,
	value: boolean | number,
	delay = 0,
): ModifierConfig[] {
	if (motion.reduced) return [];
	const curve = Animation.easeOut({ duration: duration / 1000 });
	return [animation(delay ? curve.delay(delay / 1000) : curve, value)];
}
