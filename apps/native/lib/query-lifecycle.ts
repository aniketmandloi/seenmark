import { focusManager, onlineManager } from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";

/**
 * Query Core refetches stale reads when a browser tab regains visibility; a native app has no
 * such event, so a screen left in the background kept showing old reads. Coming back to the
 * foreground counts as focus, and regaining a connection resumes and refetches reads that
 * paused or failed while offline.
 */
export function connectQueryLifecycle() {
	if (Platform.OS === "web") return;

	focusManager.setEventListener((setFocused) => {
		const subscription = AppState.addEventListener("change", (state) => {
			setFocused(state === "active");
		});
		return () => subscription.remove();
	});

	onlineManager.setEventListener((setOnline) => {
		const subscription = Network.addNetworkStateListener((state) => {
			setOnline(state.isConnected !== false);
		});
		return () => subscription.remove();
	});
}
