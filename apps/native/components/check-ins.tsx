import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useState } from "react";
import {
	ActivityIndicator,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";
import { queryClient, trpc } from "@/utils/trpc";

type Band = "early" | "mid" | "late";

const BANDS: { value: Band; label: string }[] = [
	{ value: "early", label: "Early" },
	{ value: "mid", label: "Mid" },
	{ value: "late", label: "Late" },
];

function CheckIns() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);
	const [openedId, setOpenedId] = useState<string | null>(null);

	const checkIns = useQuery(trpc.checkIn.list.queryOptions());
	const score = useQuery(trpc.score.current.queryOptions());
	const menu = useQuery({
		...trpc.menu.current.queryOptions(),
		enabled: score.data != null,
	});
	const record = useMutation(trpc.checkIn.record.mutationOptions());
	const remove = useMutation(trpc.checkIn.delete.mutationOptions());
	const choose = useMutation(trpc.score.choose.mutationOptions());

	async function invalidateMemberLoop() {
		await Promise.all([
			queryClient.invalidateQueries({
				queryKey: trpc.checkIn.list.queryKey(),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.score.current.queryKey(),
			}),
			queryClient.invalidateQueries({
				queryKey: trpc.menu.current.queryKey(),
			}),
		]);
	}

	async function takeCheckIn() {
		setError(null);
		setCameraDenied(false);

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

		if (result.canceled) {
			return;
		}

		const asset = result.assets[0];
		if (!asset?.base64) {
			setError("Camera did not return a photo");
			return;
		}

		try {
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
			if (openedId === id) {
				setOpenedId(null);
			}
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to delete check-in",
			);
		}
	}

	async function chooseBand(band: Band) {
		setError(null);
		try {
			await choose.mutateAsync(band);
			await invalidateMemberLoop();
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to choose a score",
			);
		}
	}

	const items = checkIns.data ?? [];
	const isEmpty = !checkIns.isLoading && items.length === 0;
	const isBusy =
		record.isPending || remove.isPending || choose.isPending;
	const currentBand = score.data ?? null;
	const currentMenu = currentBand ? (menu.data?.menu ?? null) : null;
	const paidLink =
		currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;
	const opened = openedId
		? (items.find((item) => item.id === openedId) ?? null)
		: null;

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>Check-ins</Text>

			{cameraDenied ? (
				<Text style={[styles.cameraDeniedText, { color: theme.notification }]}>
					Camera access is required to take a check-in. Enable the camera in
					Settings to continue. A check-in cannot be imported from the photo
					library.
				</Text>
			) : null}

			{error ? (
				<Text style={[styles.errorText, { color: theme.notification }]}>
					{error}
				</Text>
			) : null}

			{checkIns.isLoading ? (
				<ActivityIndicator size="small" color={theme.text} />
			) : null}

			{isEmpty && !cameraDenied ? (
				<Text style={[styles.prompt, { color: theme.text }]}>
					Take your first check-in photo with the camera.
				</Text>
			) : null}

			{!cameraDenied ? (
				<TouchableOpacity
					onPress={takeCheckIn}
					disabled={isBusy}
					style={[
						styles.button,
						{
							backgroundColor: theme.primary,
							opacity: isBusy ? 0.5 : 1,
						},
					]}
				>
					{record.isPending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>
							{isEmpty ? "Take first check-in" : "Take check-in"}
						</Text>
					)}
				</TouchableOpacity>
			) : null}

			{items.length === 1 && items[0] ? (
				<View style={[styles.item, { borderColor: theme.border }]}>
					<Image
						source={{
							uri: `data:${items[0].mediaType};base64,${items[0].imageBase64}`,
						}}
						style={styles.photo}
						accessibilityLabel="Check-in photo"
					/>
					<Text style={[styles.takenAt, { color: theme.text }]}>
						{items[0].takenAt}
					</Text>
					<TouchableOpacity
						onPress={() => deleteCheckIn(items[0].id)}
						disabled={isBusy}
						style={[
							styles.deleteButton,
							{ borderColor: theme.border, opacity: isBusy ? 0.5 : 1 },
						]}
					>
						<Text style={[styles.deleteButtonText, { color: theme.text }]}>
							Delete check-in
						</Text>
					</TouchableOpacity>
				</View>
			) : null}

			{items.length >= 2 && items[0] && items[1] && !opened ? (
				<View style={[styles.comparison, { borderColor: theme.border }]}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						Compare
					</Text>
					<View style={styles.sideBySide}>
						<View style={styles.half}>
							<Image
								source={{
									uri: `data:${items[0].mediaType};base64,${items[0].imageBase64}`,
								}}
								style={styles.halfPhoto}
								accessibilityLabel="Newest check-in photo"
							/>
							<Text style={[styles.takenAt, { color: theme.text }]}>
								{items[0].takenAt}
							</Text>
							<TouchableOpacity
								onPress={() => deleteCheckIn(items[0].id)}
								disabled={isBusy}
								style={[
									styles.deleteButton,
									{ borderColor: theme.border, opacity: isBusy ? 0.5 : 1 },
								]}
							>
								<Text style={[styles.deleteButtonText, { color: theme.text }]}>
									Delete
								</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.half}>
							<Image
								source={{
									uri: `data:${items[1].mediaType};base64,${items[1].imageBase64}`,
								}}
								style={styles.halfPhoto}
								accessibilityLabel="Previous check-in photo"
							/>
							<Text style={[styles.takenAt, { color: theme.text }]}>
								{items[1].takenAt}
							</Text>
							<TouchableOpacity
								onPress={() => deleteCheckIn(items[1].id)}
								disabled={isBusy}
								style={[
									styles.deleteButton,
									{ borderColor: theme.border, opacity: isBusy ? 0.5 : 1 },
								]}
							>
								<Text style={[styles.deleteButtonText, { color: theme.text }]}>
									Delete
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			) : null}

			{opened ? (
				<View style={[styles.item, { borderColor: theme.border }]}>
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
					<Text style={[styles.takenAt, { color: theme.text }]}>
						{opened.takenAt}
					</Text>
					<TouchableOpacity
						onPress={() => setOpenedId(null)}
						style={[styles.deleteButton, { borderColor: theme.border }]}
					>
						<Text style={[styles.deleteButtonText, { color: theme.text }]}>
							Back to comparison
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => deleteCheckIn(opened.id)}
						disabled={isBusy}
						style={[
							styles.deleteButton,
							{ borderColor: theme.border, opacity: isBusy ? 0.5 : 1 },
						]}
					>
						<Text style={[styles.deleteButtonText, { color: theme.text }]}>
							Delete check-in
						</Text>
					</TouchableOpacity>
				</View>
			) : null}

			{items.length > 2 && !opened ? (
				<View style={styles.history}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						History
					</Text>
					{items.slice(2).map((item) => (
						<TouchableOpacity
							key={item.id}
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
							<Text style={[styles.takenAt, { color: theme.text }]}>
								{item.takenAt}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			) : null}

			{items.length > 0 ? (
				<View style={[styles.bands, { borderColor: theme.border }]}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						Choose a score
					</Text>
					<View style={styles.bandRow}>
						{BANDS.map((band) => {
							const selected = currentBand === band.value;
							return (
								<TouchableOpacity
									key={band.value}
									onPress={() => chooseBand(band.value)}
									disabled={isBusy}
									style={[
										styles.bandButton,
										{
											borderColor: theme.border,
											backgroundColor: selected ? theme.primary : "transparent",
											opacity: isBusy ? 0.5 : 1,
										},
									]}
								>
									<Text
										style={[
											styles.bandButtonText,
											{ color: selected ? "#ffffff" : theme.text },
										]}
									>
										{band.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			) : null}

			{currentMenu ? (
				<View style={[styles.menu, { borderColor: theme.border }]}>
					<Text style={[styles.sectionLabel, { color: theme.text }]}>
						Next steps
					</Text>
					{currentMenu.steps.map((step) => (
						<Text
							key={step}
							style={[styles.menuStep, { color: theme.text }]}
						>
							{step}
						</Text>
					))}
					{paidLink ? (
						<View style={styles.paidLinkRow}>
							<Text style={[styles.paidLinkLabel, { color: theme.text }]}>
								{paidLink.label}
							</Text>
							<TouchableOpacity
								onPress={() => Linking.openURL(paidLink.destination)}
							>
								<Text
									style={[
										styles.paidLinkDestination,
										{ color: theme.primary },
									]}
								>
									{paidLink.destination}
								</Text>
							</TouchableOpacity>
						</View>
					) : null}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		marginBottom: 16,
		padding: 16,
		borderWidth: 1,
		borderRadius: 16,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 12,
	},
	prompt: {
		fontSize: 14,
		marginBottom: 12,
	},
	cameraDeniedText: {
		fontSize: 14,
		marginBottom: 12,
	},
	errorText: {
		fontSize: 14,
		marginBottom: 12,
	},
	button: {
		padding: 12,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 16,
	},
	item: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 12,
	},
	photo: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: 8,
		backgroundColor: "#111111",
	},
	takenAt: {
		fontSize: 12,
		marginTop: 8,
		opacity: 0.7,
	},
	deleteButton: {
		marginTop: 8,
		padding: 10,
		alignItems: "center",
		borderWidth: 1,
	},
	deleteButtonText: {
		fontSize: 14,
	},
	comparison: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 12,
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: "bold",
		marginBottom: 8,
	},
	sideBySide: {
		flexDirection: "row",
		gap: 8,
	},
	half: {
		flex: 1,
	},
	halfPhoto: {
		width: "100%",
		aspectRatio: 3 / 4,
		borderRadius: 8,
		backgroundColor: "#111111",
	},
	history: {
		marginTop: 12,
	},
	historyItem: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 8,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	historyThumb: {
		width: 64,
		height: 80,
		borderRadius: 4,
		backgroundColor: "#111111",
	},
	bands: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 12,
	},
	bandRow: {
		flexDirection: "row",
		gap: 8,
	},
	bandButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		borderWidth: 1,
	},
	bandButtonText: {
		fontSize: 14,
		fontWeight: "600",
	},
	menu: {
		borderTopWidth: 1,
		paddingTop: 12,
		marginTop: 12,
		gap: 8,
	},
	menuStep: {
		fontSize: 14,
		lineHeight: 20,
	},
	paidLinkRow: {
		marginTop: 4,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: 8,
	},
	paidLinkLabel: {
		fontSize: 14,
		fontWeight: "600",
	},
	paidLinkDestination: {
		fontSize: 14,
	},
});

export { CheckIns };
