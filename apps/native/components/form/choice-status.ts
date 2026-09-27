import { useEffect, useState } from "react";

import { MOTION } from "@/lib/constants";
import { announce } from "@/lib/feedback";

export type ChoiceStatus = "saving" | "saved" | "fading";

const SAVED_FOR = 2000;

/** Where a FormChoice save stands: saving, then saved for a moment, then fading out. */
export function useChoiceStatus<T extends string>(
	pendingValue: T | undefined,
	selection: T | null,
): ChoiceStatus | null {
	const [pending, setPending] = useState(pendingValue);
	const [settled, setSettled] = useState<"saved" | "fading" | null>(null);

	if (pendingValue !== pending) {
		setPending(pendingValue);
		setSettled(
			pending !== undefined &&
				pendingValue === undefined &&
				selection === pending
				? "saved"
				: null,
		);
	}

	useEffect(() => {
		if (!settled) return;
		if (settled === "saved") announce("Saved");
		const timer = setTimeout(
			() => setSettled(settled === "saved" ? "fading" : null),
			settled === "saved" ? SAVED_FOR : MOTION.slow,
		);
		return () => clearTimeout(timer);
	}, [settled]);

	return pendingValue !== undefined ? "saving" : settled;
}
