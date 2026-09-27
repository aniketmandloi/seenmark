import { bands } from "@seenmark/api/bands";
import {
	type CheckIn,
	formatDate,
	formatDateTime,
} from "@seenmark/api/check-in-dates";
import {
	type ComparisonChoice,
	chooseSlot,
	defaultChoice,
	resolveComparison,
} from "@seenmark/api/comparison";
import { useQueries } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Linking } from "react-native";

import {
	FormButton,
	FormChoice,
	FormCompareSlider,
	FormEmptyState,
	FormErrorState,
	FormPhotos,
	FormPicker,
	FormProgress,
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
	FormSkeleton,
	FormText,
} from "@/components/form/form";
import {
	type CheckInPhoto,
	checkInPhotoQuery,
	checkInPhotoUri,
	useCheckIns,
	useMemberActions,
} from "@/lib/use-member-loop";

export default function CheckInsScreen() {
	const loop = useCheckIns();
	const actions = useMemberActions();
	const [choice, setChoice] = useState<ComparisonChoice>(defaultChoice);
	const { earlier, latest } = resolveComparison(loop.items, choice);
	// Only the compared check-ins' photos load; a history page can hold 30 of them.
	const photos = useQueries({
		queries: [earlier, latest].flatMap((item) =>
			item ? [checkInPhotoQuery(item.id)] : [],
		),
	});
	const takeCheckIn = () =>
		void actions.takeCheckIn().then((saved) => {
			if (saved) setChoice(defaultChoice);
		});
	const bandLabel = bands.find((band) => band.value === loop.band)?.label;

	return (
		<FormScreen
			onRefresh={loop.refresh}
			primaryAction={
				loop.isEmpty
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
					<FormText>
						Camera access is needed for a check-in. After allowing it in
						settings, take the check-in again.
					</FormText>
					<FormButton
						label="Open device settings"
						icon="external"
						onPress={() => void Linking.openSettings()}
					/>
				</FormSection>
			) : null}

			{loop.loadFailed ? (
				<FormErrorState
					message="Your check-ins could not load."
					footer="Nothing was changed. Pull down or try again."
					retrying={loop.isRefreshing}
					onRetry={() => void loop.refresh()}
				/>
			) : null}

			{actions.isRecording ? (
				<FormSection>
					<FormProgress label="Saving check-in…" />
				</FormSection>
			) : null}

			{loop.isLoading ? (
				<>
					<FormSection>
						<FormSkeleton shape="photos" label="Loading your photos" />
					</FormSection>
					<FormSection>
						<FormSkeleton shape="choice" label="Loading your band" />
					</FormSection>
					<FormSection>
						<FormSkeleton shape="rows" label="Loading your photo record" />
					</FormSection>
				</>
			) : null}

			{loop.isEmpty ? (
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

			{photos.some((photo) => photo.isError) ? (
				<FormErrorState
					message="Your photos could not load."
					footer="Nothing was changed. Pull down or try again."
					retrying={photos.some((photo) => photo.isFetching)}
					onRetry={() => void loop.refresh()}
				/>
			) : earlier && latest ? (
				<Compare
					items={loop.items}
					earlier={earlier}
					latest={latest}
					earlierPhoto={photos[0]?.data}
					latestPhoto={photos[1]?.data}
					onChoose={setChoice}
				/>
			) : latest ? (
				<FormSection
					title="Your baseline"
					footer="Take another check-in later to compare."
				>
					{photos[0]?.data ? (
						<FormPhotos
							photos={[
								{
									id: latest.id,
									uri: checkInPhotoUri(photos[0].data),
									accessibilityLabel: `Check-in photo from ${formatDate(latest.takenAt)}`,
									caption: formatDate(latest.takenAt),
								},
							]}
						/>
					) : (
						<FormSkeleton shape="photos" count={1} label="Loading your photo" />
					)}
				</FormSection>
			) : null}

			{loop.items.length > 0 ? (
				<FormSection
					title="Your band"
					footer="Choose the band that feels right. This is your description. It is not generated from the photo."
				>
					<FormChoice
						options={bands}
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
							title={formatDate(item.takenAt)}
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
							pending={loop.isLoadingEarlier}
						/>
					) : null}
				</FormSection>
			) : null}
		</FormScreen>
	);
}

type Mode = "side" | "slider";

const MODES: { value: Mode; label: string }[] = [
	{ value: "side", label: "Side by side" },
	{ value: "slider", label: "Slider" },
];

function comparedPhoto(slot: "Earlier" | "Latest", photo: CheckInPhoto) {
	const takenOn = formatDate(photo.takenAt);
	return {
		id: photo.id,
		uri: checkInPhotoUri(photo),
		accessibilityLabel: `${slot} check-in photo from ${takenOn}`,
		caption: `${slot} · ${takenOn}`,
	};
}

/** Any two check-ins, picked per slot, shown side by side or under a slider. */
function Compare({
	items,
	earlier,
	latest,
	earlierPhoto,
	latestPhoto,
	onChoose,
}: {
	items: readonly CheckIn[];
	earlier: CheckIn;
	latest: CheckIn;
	earlierPhoto?: CheckInPhoto;
	latestPhoto?: CheckInPhoto;
	onChoose: (choice: ComparisonChoice) => void;
}) {
	const [mode, setMode] = useState<Mode>("side");
	const current = { earlier, latest };
	// Times tell apart two check-ins from the same day; the other slot's check-in can't be picked.
	const options = (other: CheckIn) =>
		items.map((item) => ({
			value: item.id,
			label: formatDateTime(item.takenAt),
			disabled: item.id === other.id,
		}));

	return (
		<>
			<FormSection title="Compare">
				<FormChoice
					options={MODES}
					selection={mode}
					onSelectionChange={setMode}
				/>
				<FormPicker
					label="Earlier"
					options={options(latest)}
					selection={earlier.id}
					onSelectionChange={(id) =>
						onChoose(chooseSlot(current, "earlier", id))
					}
				/>
				<FormPicker
					label="Latest"
					options={options(earlier)}
					selection={latest.id}
					onSelectionChange={(id) =>
						onChoose(chooseSlot(current, "latest", id))
					}
				/>
				<FormButton
					label="Swap earlier and latest"
					icon="swap"
					onPress={() =>
						onChoose({ earlierId: latest.id, latestId: earlier.id })
					}
				/>
			</FormSection>
			<FormReveal key={mode}>
				<FormSection>
					{!earlierPhoto || !latestPhoto ? (
						<FormSkeleton
							shape="photos"
							count={mode === "side" ? 2 : 1}
							label="Loading your photos"
						/>
					) : mode === "side" ? (
						<FormPhotos
							photos={[
								comparedPhoto("Earlier", earlierPhoto),
								comparedPhoto("Latest", latestPhoto),
							]}
						/>
					) : (
						<FormCompareSlider
							earlier={comparedPhoto("Earlier", earlierPhoto)}
							latest={comparedPhoto("Latest", latestPhoto)}
						/>
					)}
				</FormSection>
			</FormReveal>
		</>
	);
}
