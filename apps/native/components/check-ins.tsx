import { useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
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

function CheckIns() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);

	const checkIns = useQuery(trpc.checkIn.list.queryOptions());
	const record = useMutation(trpc.checkIn.record.mutationOptions());
	const remove = useMutation(trpc.checkIn.delete.mutationOptions());

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
			quality: 0.8,
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
				takenAt: new Date().toISOString(),
			});
			await queryClient.invalidateQueries({
				queryKey: trpc.checkIn.list.queryKey(),
			});
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
			await queryClient.invalidateQueries({
				queryKey: trpc.checkIn.list.queryKey(),
			});
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : "Failed to delete check-in",
			);
		}
	}

	const items = checkIns.data ?? [];
	const isEmpty = !checkIns.isLoading && items.length === 0;
	const isBusy = record.isPending || remove.isPending;

	return (
		<View
			style={[
				styles.card,
				{ backgroundColor: theme.card, borderColor: theme.border },
			]}
		>
			<Text style={[styles.title, { color: theme.text }]}>Check-ins</Text>

			{cameraDenied ? (
				<Text style={[styles.stopText, { color: theme.notification }]}>
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

			{items.map((item) => (
				<View
					key={item.id}
					style={[styles.item, { borderColor: theme.border }]}
				>
					<Image
						source={{ uri: `data:image/jpeg;base64,${item.imageBase64}` }}
						style={styles.photo}
						accessibilityLabel="Check-in photo"
					/>
					<Text style={[styles.takenAt, { color: theme.text }]}>
						{item.takenAt}
					</Text>
					<TouchableOpacity
						onPress={() => deleteCheckIn(item.id)}
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
			))}
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
	stopText: {
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
});

export { CheckIns };
