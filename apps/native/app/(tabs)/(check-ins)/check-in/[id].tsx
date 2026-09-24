import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";

import {
	FormButton,
	FormConfirmButton,
	FormEmptyState,
	FormPhotos,
	FormProgress,
	FormRow,
	FormScreen,
	FormSection,
} from "@/components/form/form";
import {
	type CheckInPhoto,
	checkInPhotoQuery,
	checkInPhotoUri,
	formatCheckInDate,
	useMemberActions,
} from "@/lib/use-member-loop";

export default function CheckInScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const actions = useMemberActions();
	// A delete evicts the cached photo; this screen keeps its own copy while it pops.
	const [leaving, setLeaving] = useState<CheckInPhoto | null>(null);
	const photo = useQuery({ ...checkInPhotoQuery(id), enabled: !leaving });
	const checkIn = leaving ?? photo.data;

	if (!checkIn) {
		return (
			<FormScreen>
				{photo.isLoading ? (
					<FormSection>
						<FormProgress label="Loading your photo…" />
					</FormSection>
				) : photo.error?.data?.code === "NOT_FOUND" ? (
					<FormEmptyState
						icon="camera"
						title="This photo is no longer here."
						description="It may have been deleted from your record."
					/>
				) : (
					<FormSection footer="Nothing was changed. Try again when you are online.">
						<FormRow
							icon="error"
							title="This photo could not load."
							tone="destructive"
						/>
						<FormButton
							label={photo.isFetching ? "Trying…" : "Try again"}
							onPress={() => void photo.refetch()}
							disabled={photo.isFetching}
						/>
					</FormSection>
				)}
			</FormScreen>
		);
	}

	const takenOn = formatCheckInDate(checkIn.takenAt);

	return (
		<>
			<Stack.Screen options={{ title: takenOn }} />
			<FormScreen>
				{actions.error ? (
					<FormSection>
						<FormRow icon="error" title={actions.error} tone="destructive" />
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
							setLeaving(checkIn);
							if (await actions.deleteCheckIn(checkIn.id)) router.back();
							else setLeaving(null);
						}}
						disabled={actions.isBusy}
					/>
				</FormSection>
			</FormScreen>
		</>
	);
}
