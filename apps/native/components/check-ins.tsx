import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
	Image,
	Linking,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { BandPicker } from "@/components/band-picker";
import { ConfirmAction } from "@/components/confirm-action";
import { EarlierPhotosDisclosure } from "@/components/earlier-photos-disclosure";
import { ExternalLinkAction } from "@/components/external-link-action";
import { NativeButton } from "@/components/native-button";
import { ProgressIndicator } from "@/components/progress-indicator";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient, trpc } from "@/utils/trpc";

type Band = "early" | "mid" | "late";

const BANDS: { value: Band; label: string }[] = [
	{ value: "early", label: "Early" },
	{ value: "mid", label: "Mid" },
	{ value: "late", label: "Late" },
];

function formatDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

function CheckIns() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);
	const [openedId, setOpenedId] = useState<string | null>(null);
	const [readingMenu, setReadingMenu] = useState(false);
	const [optimisticBand, setOptimisticBand] = useState<Band | null>(null);

	const checkIns = useQuery(trpc.checkIn.list.queryOptions());
	const score = useQuery(trpc.score.current.queryOptions());
	const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
	const menu = useQuery({
		...trpc.menu.current.queryOptions(),
		enabled: score.data != null,
	});
	const record = useMutation(trpc.checkIn.record.mutationOptions());
	const remove = useMutation(trpc.checkIn.delete.mutationOptions());
	const choose = useMutation(trpc.score.choose.mutationOptions());
	const introduction = useQuery(trpc.introduction.current.queryOptions());
	const fileIntroduction = useMutation(
		trpc.introduction.file.mutationOptions(),
	);
	const deleteIntroduction = useMutation(
		trpc.introduction.delete.mutationOptions(),
	);

	async function invalidateMemberLoop() {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: trpc.checkIn.list.queryKey() }),
			queryClient.invalidateQueries({
				queryKey: trpc.score.current.queryKey(),
			}),
			queryClient.invalidateQueries({ queryKey: trpc.menu.current.queryKey() }),
			queryClient.invalidateQueries({
				queryKey: trpc.checkIn.reminder.queryKey(),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.introduction.current.queryKey(),
			}),
		]);
	}

	async function fileAnIntroduction() {
		setError(null);
		try {
			await fileIntroduction.mutateAsync();
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Failed to file an introduction",
			);
		}
	}

	async function takeBackIntroduction() {
		setError(null);
		try {
			await deleteIntroduction.mutateAsync();
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: "Failed to delete the introduction",
			);
		}
	}

	async function takeCheckIn() {
		setError(null);
		setCameraDenied(false);
		try {
			const permission = await ImagePicker.requestCameraPermissionsAsync();
			if (!permission.granted) {
				setCameraDenied(true);
				return;
			}

			const result = await ImagePicker.launchCameraAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				base64: true,
			});
			if (result.canceled) return;

			const asset = result.assets[0];
			if (!asset?.base64) {
				setError("The camera did not return a photo. Please try again.");
				return;
			}

			await record.mutateAsync({
				imageBase64: asset.base64,
				mediaType: asset.mimeType ?? "image/jpeg",
				takenAt: new Date().toISOString(),
			});
			setOpenedId(null);
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to record check-in",
			);
		}
	}

	async function deleteCheckIn(id: string) {
		setError(null);
		try {
			await remove.mutateAsync({ id });
			if (openedId === id) setOpenedId(null);
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to delete check-in",
			);
		}
	}

	async function chooseBand(band: Band) {
		setError(null);
		setOptimisticBand(band);
		try {
			await choose.mutateAsync(band);
			await invalidateMemberLoop();
			setOptimisticBand(null);
		} catch (cause) {
			setOptimisticBand(null);
			setError(
				cause instanceof Error ? cause.message : "Failed to save your band",
			);
		}
	}

	const items = checkIns.data ?? [];
	const isEmpty = !checkIns.isLoading && items.length === 0;
	const isBusy =
		record.isPending ||
		remove.isPending ||
		choose.isPending ||
		fileIntroduction.isPending ||
		deleteIntroduction.isPending;
	const currentBand = score.data ?? null;
	const displayedBand = optimisticBand ?? currentBand;
	const currentMenu = currentBand ? (menu.data?.menu ?? null) : null;
	const paidLink =
		currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;
	const opened = openedId
		? (items.find((item) => item.id === openedId) ?? null)
		: null;

	if (readingMenu && currentMenu) {
		return (
			<View
				style={[
					styles.card,
					{ backgroundColor: theme.card, borderColor: theme.border },
				]}
			>
				<NativeButton
					label="Back to check-ins"
					variant="text"
					onPress={() => setReadingMenu(false)}
					style={styles.menuBack}
				/>
				<Text style={[styles.title, { color: theme.text }]}>Next steps</Text>
				<View style={[styles.menuSteps, { borderColor: theme.border }]}>
					{currentMenu.steps.map((step, index) => (
						<View key={step} style={styles.menuStepRow}>
							<Text style={[styles.stepNumber, { color: theme.primary }]}>
								{String(index + 1).padStart(2, "0")}
							</Text>
							<Text style={[styles.menuStep, { color: theme.text }]}>
								{step}
							</Text>
						</View>
					))}
				</View>
				{currentMenu.band === "late" ? (
					<View style={styles.introduction}>
						<Text style={[styles.supportingCopy, { color: theme.muted }]}>
							{introduction.data
								? "Your request is saved here. Nothing has been sent."
								: "If you want, you can request an introduction. It will not book anything or send until you choose to continue."}
						</Text>
						{introduction.data ? (
							<ConfirmAction
								label="Delete request"
								title="Delete your introduction request?"
								message="This request will be removed from your record. Nothing has been sent."
								confirmLabel="Delete request"
								cancelLabel="Keep request"
								variant="outlined"
								onConfirm={() => void takeBackIntroduction()}
								disabled={isBusy}
								style={styles.actionButton}
							/>
						) : (
							<NativeButton
								label="File an introduction"
								onPress={() => void fileAnIntroduction()}
								disabled={isBusy}
								style={styles.actionButton}
							/>
						)}
					</View>
				) : null}
				{paidLink ? (
					<View style={[styles.paidLinkRow, { borderColor: theme.border }]}>
						<View style={styles.paidLinkCopy}>
							<Text style={[styles.paidLinkLabel, { color: theme.text }]}>
								{paidLink.label}
							</Text>
							<Text style={[styles.supportingCopy, { color: theme.muted }]}>
								Opens an external link.
							</Text>
						</View>
						<ExternalLinkAction destination={paidLink.destination} />
					</View>
				) : null}
			</View>
		);
	}

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<View style={styles.sectionHeading}>
				<Text style={[styles.eyebrow, { color: theme.primary }]}>
					YOUR PHOTO RECORD
				</Text>
				<Text style={[styles.title, { color: theme.text }]}>
					Check in at your pace.
				</Text>
			</View>

			{reminder.data?.due ? (
				<View style={[styles.reminder, { backgroundColor: theme.background }]}>
					<Text style={[styles.invitation, { color: theme.text }]}>
						{reminder.data.invitation}
					</Text>
				</View>
			) : null}

			{cameraDenied ? (
				<View style={[styles.message, { backgroundColor: theme.background }]}>
					<Text style={[styles.cameraDeniedText, { color: theme.text }]}>
						Camera access is needed for a check-in. Photos cannot be imported
						from your library.
					</Text>
					<NativeButton
						label="Open device settings"
						variant="outlined"
						onPress={() => void Linking.openSettings()}
						style={styles.settingsButton}
					/>
				</View>
			) : null}

			{error ? (
				<Text style={[styles.errorText, { color: theme.notification }]}>
					{error}
				</Text>
			) : null}

			{checkIns.isLoading ? (
				<View style={styles.loading}>
					<ProgressIndicator />
					<Text style={[styles.supportingCopy, { color: theme.muted }]}>
						Loading your photos…
					</Text>
				</View>
			) : null}

			{isEmpty && !cameraDenied ? (
				<View style={[styles.emptyState, { borderColor: theme.border }]}>
					<Text style={[styles.emptyTitle, { color: theme.text }]}>
						A first photo sets the baseline.
					</Text>
					<Text style={[styles.supportingCopy, { color: theme.muted }]}>
						Use the camera when you’re ready. The photo stays visible only to
						you.
					</Text>
				</View>
			) : null}

			{!cameraDenied ? (
				<NativeButton
					label={
						record.isPending
							? "Saving check-in…"
							: isEmpty
								? "Take first check-in"
								: "Take check-in"
					}
					onPress={() => void takeCheckIn()}
					disabled={isBusy}
					style={styles.primaryAction}
				/>
			) : null}

			{items.length === 1 && items[0] ? (
				<View style={[styles.photoPanel, { borderColor: theme.border }]}>
					<Image
						source={{
							uri: `data:${items[0].mediaType};base64,${items[0].imageBase64}`,
						}}
						style={styles.photo}
						accessibilityLabel="Check-in photo"
					/>
					<Text style={[styles.takenAt, { color: theme.muted }]}>
						{formatDate(items[0].takenAt)}
					</Text>
					<ConfirmAction
						label="Delete check-in"
						title="Delete this photo?"
						message="This check-in will be removed from your record."
						confirmLabel="Delete photo"
						cancelLabel="Keep photo"
						onConfirm={() => void deleteCheckIn(items[0].id)}
						disabled={isBusy}
						style={styles.deleteAction}
					/>
				</View>
			) : null}

			{items.length >= 2 && items[0] && items[1] && !opened ? (
				<View style={[styles.comparison, { borderColor: theme.border }]}>
					<View style={styles.comparisonHeading}>
						<Text style={[styles.sectionLabel, { color: theme.text }]}>
							Side by side
						</Text>
						<Text style={[styles.supportingCopy, { color: theme.muted }]}>
							Your two most recent photos
						</Text>
					</View>
					<View style={styles.sideBySide}>
						{[items[0], items[1]].map((item, index) => (
							<View key={item.id} style={styles.half}>
								<Image
									source={{
										uri: `data:${item.mediaType};base64,${item.imageBase64}`,
									}}
									style={styles.halfPhoto}
									accessibilityLabel={
										index === 0
											? "Newest check-in photo"
											: "Previous check-in photo"
									}
								/>
								<Text style={[styles.takenAt, { color: theme.muted }]}>
									{formatDate(item.takenAt)}
								</Text>
								<ConfirmAction
									label="Delete photo"
									title="Delete this photo?"
									message="This check-in will be removed from your record."
									confirmLabel="Delete photo"
									cancelLabel="Keep photo"
									onConfirm={() => void deleteCheckIn(item.id)}
									disabled={isBusy}
									style={styles.deleteAction}
								/>
							</View>
						))}
					</View>
				</View>
			) : null}

			{opened ? (
				<View style={[styles.photoPanel, { borderColor: theme.border }]}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						Earlier check-in
					</Text>
					<Image
						source={{
							uri: `data:${opened.mediaType};base64,${opened.imageBase64}`,
						}}
						style={styles.photo}
						accessibilityLabel="Opened check-in photo"
					/>
					<Text style={[styles.takenAt, { color: theme.muted }]}>
						{formatDate(opened.takenAt)}
					</Text>
					<NativeButton
						label="Back to comparison"
						variant="outlined"
						onPress={() => setOpenedId(null)}
						style={styles.actionButton}
					/>
					<ConfirmAction
						label="Delete check-in"
						title="Delete this photo?"
						message="This check-in will be removed from your record."
						confirmLabel="Delete photo"
						cancelLabel="Keep photo"
						onConfirm={() => void deleteCheckIn(opened.id)}
						disabled={isBusy}
						style={styles.deleteAction}
					/>
				</View>
			) : null}

			{items.length > 2 && !opened ? (
				<EarlierPhotosDisclosure
					label={`Earlier photos (${items.length - 2})`}
					labelColor={theme.text}
					borderColor={theme.border}
					style={styles.history}
				>
					<View>
						{items.slice(2).map((item) => (
							<TouchableOpacity
								key={item.id}
								accessibilityRole="button"
								accessibilityLabel={`View check-in from ${formatDate(item.takenAt)}`}
								onPress={() => setOpenedId(item.id)}
								style={[styles.historyItem, { borderColor: theme.border }]}
							>
								<Image
									source={{
										uri: `data:${item.mediaType};base64,${item.imageBase64}`,
									}}
									style={styles.historyThumb}
									accessibilityLabel="Earlier check-in photo"
								/>
								<View style={styles.historyCopy}>
									<Text style={[styles.historyDate, { color: theme.text }]}>
										{formatDate(item.takenAt)}
									</Text>
									<Text style={[styles.historyHint, { color: theme.muted }]}>
										View photo
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</EarlierPhotosDisclosure>
			) : null}

			{items.length > 0 ? (
				<View style={[styles.bands, { borderColor: theme.border }]}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						Choose the band that feels right
					</Text>
					<Text style={[styles.supportingCopy, { color: theme.muted }]}>
						This is your description. It is not generated from the photo.
					</Text>
					<BandPicker
						options={BANDS}
						selection={displayedBand}
						enabled={!isBusy}
						tintColor={theme.primary}
						appearance={colorScheme}
						style={styles.segmentedControl}
						onSelectionChange={(value) => {
							const band = BANDS.find((item) => item.value === value);
							if (band) void chooseBand(band.value);
						}}
					/>
				</View>
			) : null}

			{currentMenu ? (
				<NativeButton
					label="Read your next-step menu"
					onPress={() => setReadingMenu(true)}
					style={styles.menuAction}
				/>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 16,
		padding: 20,
		borderWidth: 1,
		borderRadius: 24,
	},
	sectionHeading: {
		marginBottom: 16,
	},
	eyebrow: {
		fontSize: 11,
		letterSpacing: 1.1,
		fontWeight: "700",
		marginBottom: 8,
	},
	title: {
		fontSize: 22,
		lineHeight: 28,
		fontWeight: "600",
	},
	reminder: {
		padding: 14,
		borderRadius: 15,
		marginBottom: 14,
	},
	invitation: {
		fontSize: 14,
		lineHeight: 21,
	},
	message: {
		padding: 14,
		borderRadius: 15,
		marginBottom: 14,
	},
	cameraDeniedText: {
		fontSize: 14,
		lineHeight: 21,
	},
	settingsButton: {
		alignSelf: "flex-start",
		marginTop: 10,
	},
	errorText: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 14,
	},
	loading: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingVertical: 12,
	},
	emptyState: {
		paddingVertical: 16,
		marginBottom: 14,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	emptyTitle: {
		fontSize: 17,
		fontWeight: "600",
		marginBottom: 5,
	},
	supportingCopy: {
		fontSize: 14,
		lineHeight: 21,
	},
	primaryAction: {
		alignSelf: "stretch",
		marginBottom: 8,
	},
	photoPanel: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 18,
		marginTop: 10,
	},
	photo: {
		width: "100%",
		aspectRatio: 4 / 5,
		borderRadius: 18,
		backgroundColor: "#D8D8D0",
	},
	takenAt: {
		fontSize: 13,
		fontWeight: "500",
		marginTop: 10,
	},
	deleteAction: {
		alignSelf: "flex-start",
		marginTop: 2,
	},
	comparison: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 18,
		marginTop: 10,
	},
	comparisonHeading: {
		marginBottom: 14,
	},
	sectionLabel: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 5,
	},
	sideBySide: {
		flexDirection: "row",
		gap: 10,
	},
	half: {
		flex: 1,
	},
	halfPhoto: {
		width: "100%",
		aspectRatio: 4 / 5,
		borderRadius: 14,
		backgroundColor: "#D8D8D0",
	},
	history: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 18,
		marginTop: 12,
	},
	historyItem: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingVertical: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	historyThumb: {
		width: 62,
		height: 76,
		borderRadius: 10,
		backgroundColor: "#D8D8D0",
	},
	historyCopy: {
		gap: 4,
	},
	historyDate: {
		fontSize: 14,
		fontWeight: "600",
	},
	historyHint: {
		fontSize: 13,
	},
	bands: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 18,
		marginTop: 12,
	},
	segmentedControl: {
		width: "100%",
		marginTop: 12,
	},
	menuAction: {
		alignSelf: "stretch",
		marginTop: 18,
	},
	menuBack: {
		alignSelf: "flex-start",
		marginBottom: 12,
	},
	menuSteps: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth,
		paddingVertical: 6,
		marginTop: 12,
	},
	menuStepRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 12,
		paddingVertical: 11,
	},
	stepNumber: {
		fontSize: 12,
		fontWeight: "700",
		marginTop: 3,
	},
	menuStep: {
		flex: 1,
		fontSize: 15,
		lineHeight: 22,
	},
	introduction: {
		marginTop: 18,
	},
	actionButton: {
		alignSelf: "flex-start",
		marginTop: 12,
	},
	paidLinkRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 16,
		marginTop: 18,
	},
	paidLinkCopy: {
		flex: 1,
		gap: 4,
	},
	paidLinkLabel: {
		fontSize: 15,
		fontWeight: "600",
	},
});

export { CheckIns };
