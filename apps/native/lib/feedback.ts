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
