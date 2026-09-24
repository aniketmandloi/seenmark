import { isPhotoMediaType } from "@seenmark/api/photo";
import { type QueryKey, useMutation, useQuery } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

import { queryClient, trpc } from "@/utils/trpc";

export type Band = "early" | "mid" | "late";

export const BANDS: readonly { value: Band; label: string }[] = [
	{ value: "early", label: "Early" },
	{ value: "mid", label: "Mid" },
	{ value: "late", label: "Late" },
];

export function formatCheckInDate(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	}).format(date);
}

export function checkInPhotoUri(checkIn: {
	mediaType: string;
	imageBase64: string;
}) {
	return `data:${checkIn.mediaType};base64,${checkIn.imageBase64}`;
}

/** A recorded photo never changes, so once loaded it is never refetched. */
export function checkInPhotoQuery(id: string) {
	return {
		...trpc.checkIn.photo.queryOptions({ id }),
		staleTime: Number.POSITIVE_INFINITY,
	};
}

function messageFrom(cause: unknown, fallback: string) {
	return cause instanceof Error ? cause.message : fallback;
}

async function refresh(...queryKeys: QueryKey[]) {
	await Promise.all(
		queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
	);
}

const checkInsKey = trpc.checkIn.list.queryKey();
const reminderKey = trpc.checkIn.reminder.queryKey();
const bandKey = trpc.score.current.queryKey();
const menuKey = trpc.menu.current.queryKey();
const introductionKey = trpc.introduction.current.queryKey();

// A menu belongs to one band, so a changed band drops it rather than showing it stale.
function forgetMenu() {
	return queryClient.resetQueries({ queryKey: menuKey });
}

/** The check-ins screen: the photo record, the reminder and the chosen band. */
export function useCheckIns() {
	const checkIns = useQuery(trpc.checkIn.list.queryOptions());
	const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
	const band = useQuery(trpc.score.current.queryOptions());
	const items = checkIns.data ?? [];

	return {
		items,
		isLoading: checkIns.isLoading,
		isEmpty: !checkIns.isLoading && items.length === 0,
		reminder: reminder.data?.due ? reminder.data.invitation : null,
		band: band.data ?? null,
		refresh: () => refresh(checkInsKey, reminderKey, bandKey),
	};
}

/** The next-steps screen: the menu for the chosen band and any introduction. */
export function useNextSteps() {
	const menu = useQuery(trpc.menu.current.queryOptions());
	const introduction = useQuery(trpc.introduction.current.queryOptions());
	const currentMenu = menu.data?.menu ?? null;

	return {
		isLoading: menu.isLoading || introduction.isLoading,
		menu: currentMenu,
		paidLink:
			currentMenu && "paidLink" in currentMenu
				? currentMenu.paidLink
				: undefined,
		introduction: introduction.data ?? null,
		refresh: () => refresh(menuKey, introductionKey),
	};
}

/** The actions that change the member loop; each refreshes only the reads it can change. */
export function useMemberActions() {
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);

	const record = useMutation(trpc.checkIn.record.mutationOptions());
	const remove = useMutation(trpc.checkIn.delete.mutationOptions());
	const choose = useMutation(trpc.score.choose.mutationOptions());
	const fileIntroduction = useMutation(
		trpc.introduction.file.mutationOptions(),
	);
	const deleteIntroduction = useMutation(
		trpc.introduction.delete.mutationOptions(),
	);

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
			const mediaType = asset.mimeType ?? "image/jpeg";
			if (!isPhotoMediaType(mediaType)) {
				setError("The camera returned a photo format Seenmark cannot keep.");
				return;
			}

			await record.mutateAsync({
				imageBase64: asset.base64,
				mediaType,
				takenAt: new Date().toISOString(),
			});
			await refresh(checkInsKey, reminderKey);
		} catch (cause) {
			setError(messageFrom(cause, "Failed to record check-in"));
		}
	}

	async function deleteCheckIn(id: string) {
		setError(null);
		try {
			await remove.mutateAsync({ id });
			// Deleting the last check-in also clears the band.
			await Promise.all([
				refresh(checkInsKey, reminderKey, bandKey),
				forgetMenu(),
			]);
			return true;
		} catch (cause) {
			setError(messageFrom(cause, "Failed to delete check-in"));
			return false;
		}
	}

	async function chooseBand(band: Band) {
		setError(null);
		await queryClient.cancelQueries({ queryKey: bandKey });
		queryClient.setQueryData(bandKey, band);
		try {
			await choose.mutateAsync(band);
			await forgetMenu();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to save your band"));
			await refresh(bandKey);
		}
	}

	async function fileAnIntroduction() {
		setError(null);
		try {
			await fileIntroduction.mutateAsync();
			await refresh(introductionKey);
		} catch (cause) {
			setError(messageFrom(cause, "Failed to file an introduction"));
		}
	}

	async function takeBackIntroduction() {
		setError(null);
		try {
			await deleteIntroduction.mutateAsync();
			await refresh(introductionKey);
		} catch (cause) {
			setError(messageFrom(cause, "Failed to delete the introduction"));
		}
	}

	return {
		isRecording: record.isPending,
		isBusy:
			record.isPending ||
			remove.isPending ||
			choose.isPending ||
			fileIntroduction.isPending ||
			deleteIntroduction.isPending,
		error,
		cameraDenied,
		takeCheckIn,
		deleteCheckIn,
		chooseBand,
		fileAnIntroduction,
		takeBackIntroduction,
	};
}
