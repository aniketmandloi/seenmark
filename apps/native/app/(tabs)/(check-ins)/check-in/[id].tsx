import { formatDate, relativeTime } from "@seenmark/api/check-in-dates";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
	FormConfirmButton,
	FormEmptyState,
	FormErrorState,
	FormPhotos,
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
	FormSkeleton,
} from "@/components/form/form";
import {
	type CheckInPhoto,
	checkInPhotoQuery,
	checkInPhotoUri,
	useMemberActions,
} from "@/lib/use-member-loop";

export default function CheckInScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const actions = useMemberActions();
	// A delete evicts the cached photo; this screen keeps its own copy while it pops.
	const [leaving, setLeaving] = useState<CheckInPhoto | null>(null);
	const photo = useQuery({ ...checkInPhotoQuery(id), enabled: !leaving });
	const checkIn = leaving ?? photo.data;
	const [now] = useState(() => Date.now());

	if (!checkIn) {
		return (
			<FormScreen>
				{photo.isLoading ? (
					<FormSection>
						<FormSkeleton shape="photos" count={1} label="Loading your photo" />
					</FormSection>
				) : photo.error?.data?.code === "NOT_FOUND" ? (
					<FormEmptyState
						icon="camera"
						title="This photo is no longer here."
						description="It may have been deleted from your record."
					/>
				) : (
					<FormErrorState
						message="This photo could not load."
						footer="Nothing was changed. Try again when you are online."
						retrying={photo.isFetching}
						onRetry={() => void photo.refetch()}
					/>
				)}
			</FormScreen>
		);
	}

	const takenOn = formatDate(checkIn.takenAt);

	return (
		<>
			<Stack.Screen options={{ title: takenOn }} />
			<FormScreen>
				{actions.error ? (
					<FormReveal>
						<FormSection>
							<FormRow icon="error" title={actions.error} tone="destructive" />
						</FormSection>
					</FormReveal>
				) : null}
				<FormSection footer="Only you can see this photo.">
					<FormPhotos
						photos={[
							{
								id: checkIn.id,
								uri: checkInPhotoUri(checkIn),
								accessibilityLabel: `Check-in photo from ${takenOn}`,
								caption: `Taken ${takenOn} · ${relativeTime(checkIn.takenAt, now)}`,
							},
						]}
					/>
				</FormSection>
				<FormSection>
					<FormConfirmButton
						label={actions.isDeleting ? "Deleting…" : "Delete photo"}
						icon="delete"
						title="Delete this photo?"
						message="This check-in will be removed from your record."
						confirmLabel="Delete photo"
						cancelLabel="Keep photo"
						onConfirm={async () => {
							setLeaving(checkIn);
							if (await actions.deleteCheckIn(checkIn.id)) router.back();
							else setLeaving(null);
						}}
						disabled={actions.isBusy}
						pending={actions.isDeleting}
					/>
				</FormSection>
			</FormScreen>
		</>
	);
}
