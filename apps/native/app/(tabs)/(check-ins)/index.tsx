import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking } from "react-native";

import {
	FormButton,
	FormChoice,
	FormEmptyState,
	FormPhotos,
	FormProgress,
	FormRow,
	FormScreen,
	FormSection,
	FormText,
} from "@/components/form/form";
import {
	BANDS,
	checkInPhotoQuery,
	checkInPhotoUri,
	formatCheckInDate,
	useCheckIns,
	useMemberActions,
} from "@/lib/use-member-loop";

export default function CheckInsScreen() {
	const loop = useCheckIns();
	const actions = useMemberActions();
	const latest = useQueries({
		queries: loop.items.slice(0, 2).map((item) => checkInPhotoQuery(item.id)),
	});
	const latestPhotos = latest.flatMap(({ data }) => (data ? [data] : []));
	const takeCheckIn = () => void actions.takeCheckIn();
	const bandLabel = BANDS.find((band) => band.value === loop.band)?.label;

	return (
		<FormScreen
			onRefresh={loop.refresh}
			primaryAction={
				loop.isEmpty || actions.cameraDenied
					? undefined
					: {
							label: "Take check-in",
							icon: "camera",
							onPress: takeCheckIn,
							disabled: actions.isBusy,
						}
			}
		>
			{loop.reminder ? (
				<FormSection>
					<FormRow
						icon="reminder"
						title={loop.reminder}
						tone="accent"
						onPress={takeCheckIn}
						disabled={actions.isBusy}
					/>
				</FormSection>
			) : null}

			{actions.error ? (
				<FormSection>
					<FormRow icon="error" title={actions.error} tone="destructive" />
				</FormSection>
			) : null}

			{actions.cameraDenied ? (
				<FormSection
					title="Camera access"
					footer="Photos cannot be imported from your library."
				>
					<FormText>Camera access is needed for a check-in.</FormText>
					<FormButton
						label="Open device settings"
						icon="external"
						onPress={() => void Linking.openSettings()}
					/>
				</FormSection>
			) : null}

			{loop.isLoading || actions.isRecording ? (
				<FormSection>
					<FormProgress
						label={
							actions.isRecording ? "Saving check-in…" : "Loading your photos…"
						}
					/>
				</FormSection>
			) : null}

			{loop.isEmpty && !actions.cameraDenied ? (
				<>
					<FormEmptyState
						icon="camera"
						title="A first photo sets the baseline."
						description="Use the camera when you’re ready. The photo stays visible only to you."
					/>
					<FormButton
						label="Take first check-in"
						onPress={takeCheckIn}
						disabled={actions.isBusy}
						prominent
					/>
				</>
			) : null}

			{latest.length > 0 ? (
				<FormSection
					title={latest.length > 1 ? "Side by side" : "Your baseline"}
					footer={
						latest.length > 1
							? "Your two most recent photos."
							: "Take another check-in later to compare."
					}
				>
					{latest.some((photo) => photo.isError) ? (
						<FormRow
							icon="error"
							title="Your photos could not load."
							tone="destructive"
						/>
					) : latestPhotos.length === latest.length ? (
						<FormPhotos
							photos={latestPhotos.map((photo, index) => ({
								id: photo.id,
								uri: checkInPhotoUri(photo),
								accessibilityLabel:
									index === 0
										? "Newest check-in photo"
										: "Previous check-in photo",
								caption: formatCheckInDate(photo.takenAt),
							}))}
						/>
					) : (
						<FormProgress label="Loading your photos…" />
					)}
				</FormSection>
			) : null}

			{loop.items.length > 0 ? (
				<FormSection
					title="Your band"
					footer="Choose the band that feels right. This is your description. It is not generated from the photo."
				>
					<FormChoice
						options={BANDS}
						selection={loop.band}
						onSelectionChange={(band) => void actions.chooseBand(band)}
						disabled={actions.isBusy}
					/>
				</FormSection>
			) : null}

			{loop.band || loop.hasIntroduction ? (
				<FormSection>
					<FormRow
						icon="steps"
						title="Next steps"
						subtitle={
							bandLabel
								? `For the ${bandLabel.toLowerCase()} band`
								: "Your introduction request"
						}
						showsChevron
						onPress={() => router.push("/next-steps")}
					/>
				</FormSection>
			) : null}

			{loop.items.length > 0 ? (
				<FormSection
					title="Photo record"
					footer="Only you can see these photos. Open one to view or delete it."
				>
					{loop.items.map((item, index) => (
						<FormRow
							key={item.id}
							icon="camera"
							title={formatCheckInDate(item.takenAt)}
							subtitle={index === 0 ? "Newest" : undefined}
							showsChevron
							onPress={() =>
								router.push({
									pathname: "/check-in/[id]",
									params: { id: item.id },
								})
							}
						/>
					))}
					{loop.hasEarlier ? (
						<FormButton
							label={
								loop.isLoadingEarlier ? "Loading…" : "Show earlier check-ins"
							}
							onPress={loop.loadEarlier}
							disabled={loop.isLoadingEarlier}
						/>
					) : null}
				</FormSection>
			) : null}
		</FormScreen>
	);
}
