import {
	type AnimationSpec,
	snap,
	tween,
} from "@expo/ui/jetpack-compose/modifiers";

import type { Motion } from "@/lib/motion";

/** How something arrives over `duration` ms; it jumps straight there under reduced motion. */
export function enter(
	motion: Motion,
	duration: number,
	delay = 0,
): AnimationSpec {
	return motion.reduced
		? snap()
		: tween({
				durationMillis: duration,
				delayMillis: delay,
				easing: "linearOutSlowIn",
			});
}
