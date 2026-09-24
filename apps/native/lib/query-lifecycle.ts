import { focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

/**
 * Query Core refetches stale reads when a browser tab regains visibility; a native app has no
 * such event, so a screen left in the background kept showing old reads. Coming back to the
 * foreground now counts as focus.
 */
export function connectQueryLifecycle() {
	if (Platform.OS === "web") return;

	focusManager.setEventListener((setFocused) => {
		const subscription = AppState.addEventListener("change", (state) => {
			setFocused(state === "active");
		});
		return () => subscription.remove();
	});
}
