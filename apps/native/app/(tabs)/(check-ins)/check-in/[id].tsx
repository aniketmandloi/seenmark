import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
	FormConfirmButton,
	FormEmptyState,
	FormPhotos,
	FormProgress,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";
import {
	checkInPhotoUri,
	formatCheckInDate,
	useMemberLoop,
} from "@/lib/use-member-loop";

export default function CheckInScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const loop = useMemberLoop();
	const found = loop.items.find((item) => item.id === id);
	// Keep showing the photo while the screen pops after a delete removes it from the list.
	const [lastSeen, setLastSeen] = useState(found);
	if (found && found !== lastSeen) setLastSeen(found);
	const checkIn = found ?? lastSeen;

	if (!checkIn) {
		return (
			<FormScreen>
				{loop.isLoading ? (
					<FormSection>
						<FormProgress label="Loading your photo…" />
					</FormSection>
				) : (
					<FormEmptyState
						icon="camera"
						title="This photo is no longer here."
						description="It may have been deleted from your record."
					/>
				)}
			</FormScreen>
		);
	}

	const takenOn = formatCheckInDate(checkIn.takenAt);

	return (
		<>
			<Stack.Screen options={{ title: takenOn }} />
			<FormScreen>
				{loop.error ? (
					<FormSection>
						<FormRow icon="error" title={loop.error} tone="destructive" />
					</FormSection>
				) : null}
				<FormSection footer="Only you can see this photo.">
					<FormPhotos
						photos={[
							{
								id: checkIn.id,
								uri: checkInPhotoUri(checkIn),
								accessibilityLabel: `Check-in photo from ${takenOn}`,
								caption: `Taken ${takenOn}`,
							},
						]}
					/>
				</FormSection>
				<FormSection>
					<FormConfirmButton
						label="Delete photo"
						icon="delete"
						title="Delete this photo?"
						message="This check-in will be removed from your record."
						confirmLabel="Delete photo"
						cancelLabel="Keep photo"
						onConfirm={async () => {
							if (await loop.deleteCheckIn(checkIn.id)) router.back();
						}}
						disabled={loop.isBusy}
					/>
				</FormSection>
			</FormScreen>
		</>
	);
}
