import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { MOTION } from "@/lib/constants";

export type Motion = typeof MOTION & { reduced: boolean };

// Reanimated reads the setting once at launch; this follows it while the app is open, so a
// screen mounted after the member changes it starts from the current value too.
let reducedNow: boolean | null = null;
const listeners = new Set<() => void>();
AccessibilityInfo.addEventListener("reduceMotionChanged", (reduced) => {
	reducedNow = reduced;
	for (const listener of listeners) listener();
});

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** The motion tokens, and whether the member turned motion off in the system settings. */
export function useMotion(): Motion {
	const atLaunch = useReducedMotion();
	const reduced = useSyncExternalStore(subscribe, () => reducedNow ?? atLaunch);
	return { reduced, ...MOTION };
}

const MAX_STAGGER_STEPS = 6;

/** The entrance delay for the item at `index`, capped so long lists don't lag. */
export function staggerDelay(motion: Motion, index: number) {
	return Math.min(index, MAX_STAGGER_STEPS) * motion.stagger;
}
