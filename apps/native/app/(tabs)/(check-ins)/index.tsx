import { bands } from "@seenmark/api/bands";
import {
	type CheckIn,
	formatDate,
	formatDateTime,
	groupByMonth,
	relativeTime,
} from "@seenmark/api/check-in-dates";
import {
	type ComparisonChoice,
	chooseSlot,
	defaultChoice,
	resolveComparison,
	type Slot,
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
	FormReveal,
	FormRow,
	FormScreen,
	FormSection,
	FormSkeleton,
	FormText,
} from "@/components/form/form";
import type { FormRowAction } from "@/components/form/types";
import { announce } from "@/lib/feedback";
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
	const [now] = useState(() => Date.now());
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
							label: actions.isRecording ? "Saving check-in…" : "Take check-in",
							icon: "camera",
							onPress: takeCheckIn,
							disabled: actions.isBusy,
							pending: actions.isRecording,
						}
			}
		>
			{loop.reminder ? (
				<FormReveal>
					<FormSection>
						<FormRow
							icon="reminder"
							title={loop.reminder}
							tone="accent"
							onPress={takeCheckIn}
							disabled={actions.isBusy}
						/>
					</FormSection>
				</FormReveal>
			) : null}

			{actions.error ? (
				<FormReveal>
					<FormSection>
						<FormRow icon="error" title={actions.error} tone="destructive" />
					</FormSection>
				</FormReveal>
			) : null}

			{actions.cameraDenied ? (
				<FormReveal>
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
				</FormReveal>
			) : null}

			{loop.loadFailed ? (
				<FormErrorState
					message="Your check-ins could not load."
					footer="Nothing was changed. Pull down or try again."
					retrying={loop.isRefreshing}
					onRetry={() => void loop.refresh()}
				/>
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
						label={
							actions.isRecording ? "Saving check-in…" : "Take first check-in"
						}
						onPress={takeCheckIn}
						disabled={actions.isBusy}
						pending={actions.isRecording}
						prominent
					/>
				</>
			) : null}

			{loop.items[0] ? (
				<FormSection>
					<FormText>
						{`${loop.items.length}${loop.hasEarlier ? "+" : ""} ${loop.items.length === 1 ? "check-in" : "check-ins"} · last one ${relativeTime(loop.items[0].takenAt, now)}`}
					</FormText>
				</FormSection>
			) : null}

			{actions.isRecording ? (
				<FormSection>
					<FormSkeleton shape="photos" count={1} label="Saving check-in…" />
				</FormSection>
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
					footer="Choose the band that feels right. This is your description. It is not generated from the photo. You can change your choice whenever you want."
				>
					<FormChoice
						options={bands}
						selection={loop.band}
						onSelectionChange={(band) => void actions.chooseBand(band)}
						disabled={actions.isBusy}
						pendingValue={actions.savingBand}
					/>
				</FormSection>
			) : null}

			{loop.band || loop.hasIntroduction ? (
				<FormReveal>
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
				</FormReveal>
			) : null}

			<Timeline
				items={loop.items}
				now={now}
				comparing={{ earlier, latest }}
				onChoose={setChoice}
				onDelete={(id) => void actions.deleteCheckIn(id)}
				busy={actions.isBusy}
				showEarlier={
					loop.hasEarlier
						? {
								isLoading: loop.isLoadingEarlier,
								failed: loop.loadEarlierFailed,
								onPress: loop.loadEarlier,
							}
						: null
				}
			/>
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
					onPress={() => {
						onChoose({ earlierId: latest.id, latestId: earlier.id });
						announce(
							`Comparing ${formatDate(latest.takenAt)} as earlier and ${formatDate(earlier.takenAt)} as latest`,
						);
					}}
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

const SLOTS: Slot[] = ["earlier", "latest"];

function openCheckIn(id: string) {
	router.push({ pathname: "/check-in/[id]", params: { id } });
}

/** Dates only, one section per month: a history page can hold 30 check-ins, too many photos to list. */
function Timeline({
	items,
	now,
	comparing,
	onChoose,
	onDelete,
	busy,
	showEarlier,
}: {
	items: readonly CheckIn[];
	now: number;
	comparing: { earlier?: CheckIn; latest?: CheckIn };
	onChoose: (choice: ComparisonChoice) => void;
	onDelete: (id: string) => void;
	busy: boolean;
	showEarlier: {
		isLoading: boolean;
		failed: boolean;
		onPress: () => void;
	} | null;
}) {
	const groups = groupByMonth(items);
	const compareAs = (slot: Slot, item: CheckIn) => {
		onChoose(chooseSlot(comparing, slot, item.id));
		announce(`Comparing ${formatDate(item.takenAt)} as ${slot}`);
	};

	return groups.map((group, groupIndex) => (
		<FormSection
			key={group.key}
			title={group.label}
			footer={
				groupIndex === 0
					? "Only you can see these photos. Open one to view or delete it."
					: undefined
			}
		>
			{group.items.map((item) => {
				// Counted across months, so the stagger runs down the whole screen.
				const index = items.indexOf(item);
				return (
					<FormReveal key={item.id} index={index}>
						<FormRow
							icon="camera"
							title={formatDate(item.takenAt)}
							subtitle={index === 0 ? "Newest" : undefined}
							value={relativeTime(item.takenAt, now)}
							showsChevron
							onPress={() => openCheckIn(item.id)}
							actions={[
								{
									label: "Open",
									icon: "open",
									onPress: () => openCheckIn(item.id),
								},
								...(items.length > 1 ? SLOTS : []).map(
									(slot): FormRowAction => ({
										label: `Compare as ${slot}`,
										icon: "compare",
										disabled: comparing[slot]?.id === item.id,
										onPress: () => compareAs(slot, item),
									}),
								),
								{
									label: "Delete…",
									icon: "delete",
									destructive: true,
									disabled: busy,
									confirm: {
										title: "Delete this photo?",
										message: "This check-in will be removed from your record.",
										confirmLabel: "Delete photo",
										cancelLabel: "Keep photo",
									},
									onPress: () => onDelete(item.id),
								},
							]}
						/>
					</FormReveal>
				);
			})}
			{showEarlier && groupIndex === groups.length - 1 ? (
				<>
					{showEarlier.failed ? (
						<FormRow
							icon="error"
							title="Couldn’t load earlier check-ins."
							tone="destructive"
						/>
					) : null}
					{/* The same button retries, so screen reader focus stays where it was. */}
					<FormButton
						label={
							showEarlier.isLoading
								? "Loading…"
								: showEarlier.failed
									? "Try again"
									: "Show earlier check-ins"
						}
						onPress={showEarlier.onPress}
						pending={showEarlier.isLoading}
					/>
				</>
			) : null}
		</FormSection>
	));
}
