import * as Haptics from "expo-haptics";
import { AccessibilityInfo, Platform } from "react-native";

// Haptics only confirm what the member just did, and a missing one changes nothing, so a
// failure is dropped rather than surfaced.
function feel(ios: () => Promise<void>, android: Haptics.AndroidHaptics) {
	const haptic =
		Platform.OS === "android"
			? Haptics.performAndroidHapticsAsync(android)
			: ios();
	void haptic.catch(() => undefined);
}

/** A band was chosen. */
export function confirmChoice() {
	feel(Haptics.selectionAsync, Haptics.AndroidHaptics.Segment_Tick);
}

/** A check-in was saved or an introduction filed. */
export function confirmSaved() {
	feel(
		() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
		Haptics.AndroidHaptics.Confirm,
	);
}

/** A delete the member confirmed went through. */
export function confirmDeleted() {
	feel(
		() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
		Haptics.AndroidHaptics.Confirm,
	);
}

/** Tells VoiceOver or TalkBack about a change the member can't see happen. */
export function announce(message: string) {
	AccessibilityInfo.announceForAccessibility(message);
}

const results: string[] = [];
let showResult: ((message: string) => void) | null = null;

function deliverResults() {
	if (!showResult) return;
	for (const message of results.splice(0)) showResult(message);
}

/**
 * Reports a result the member can't see happen, like a check-in deleted from a screen that then
 * pops. Android shows it in a Snackbar on the screen in front; iOS has no toast, so it is only
 * announced there, and the change itself shows where it happens.
 */
export function notifyResult(message: string) {
	if (Platform.OS !== "android") {
		announce(message);
		return;
	}
	results.push(message);
	// Delivered a frame later, so a message posted just before router.back() reaches the screen
	// underneath once it has taken focus, not the one leaving.
	requestAnimationFrame(deliverResults);
}

/** Makes `show` the place results appear; they wait in the queue while no screen takes them. */
export function showResultsIn(show: (message: string) => void) {
	showResult = show;
	deliverResults();
	return () => {
		if (showResult === show) showResult = null;
	};
}
