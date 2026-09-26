import { useReducedMotion } from "react-native-reanimated";

import { MOTION } from "@/lib/constants";

export type Motion = typeof MOTION & { reduced: boolean };

/** The motion tokens, and whether the member turned motion off in the system settings. */
export function useMotion(): Motion {
	const reduced = useReducedMotion();
	return { reduced, ...MOTION };
}

const MAX_STAGGER_STEPS = 6;

/** The entrance delay for the item at `index`, capped so long lists don't lag. */
export function staggerDelay(motion: Motion, index: number) {
	return Math.min(index, MAX_STAGGER_STEPS) * motion.stagger;
}
