import { useMutation, useQuery } from "@tanstack/react-query";
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

async function invalidateMemberLoop() {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: trpc.checkIn.list.queryKey() }),
		queryClient.invalidateQueries({ queryKey: trpc.score.current.queryKey() }),
		queryClient.invalidateQueries({ queryKey: trpc.menu.current.queryKey() }),
		queryClient.invalidateQueries({
			queryKey: trpc.checkIn.reminder.queryKey(),
		}),
		queryClient.invalidateQueries({
			queryKey: trpc.introduction.current.queryKey(),
		}),
	]);
}

/** The member's check-ins, band, menu and introduction, with the actions that change them. */
export function useMemberLoop() {
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);
	const [optimisticBand, setOptimisticBand] = useState<Band | null>(null);

	const checkIns = useQuery(trpc.checkIn.list.queryOptions());
	const score = useQuery(trpc.score.current.queryOptions());
	const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
	const menu = useQuery({
		...trpc.menu.current.queryOptions(),
		enabled: score.data != null,
	});
	const introduction = useQuery(trpc.introduction.current.queryOptions());

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

			await record.mutateAsync({
				imageBase64: asset.base64,
				mediaType: asset.mimeType ?? "image/jpeg",
				takenAt: new Date().toISOString(),
			});
			await invalidateMemberLoop();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to record check-in"));
		}
	}

	async function deleteCheckIn(id: string) {
		setError(null);
		try {
			await remove.mutateAsync({ id });
			await invalidateMemberLoop();
			return true;
		} catch (cause) {
			setError(messageFrom(cause, "Failed to delete check-in"));
			return false;
		}
	}

	async function chooseBand(band: Band) {
		setError(null);
		setOptimisticBand(band);
		try {
			await choose.mutateAsync(band);
			await invalidateMemberLoop();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to save your band"));
		} finally {
			setOptimisticBand(null);
		}
	}

	async function fileAnIntroduction() {
		setError(null);
		try {
			await fileIntroduction.mutateAsync();
			await invalidateMemberLoop();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to file an introduction"));
		}
	}

	async function takeBackIntroduction() {
		setError(null);
		try {
			await deleteIntroduction.mutateAsync();
			await invalidateMemberLoop();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to delete the introduction"));
		}
	}

	const items = checkIns.data ?? [];
	const currentBand = score.data ?? null;
	const currentMenu = currentBand ? (menu.data?.menu ?? null) : null;

	return {
		items,
		isLoading: checkIns.isLoading,
		isEmpty: !checkIns.isLoading && items.length === 0,
		isRecording: record.isPending,
		isBusy:
			record.isPending ||
			remove.isPending ||
			choose.isPending ||
			fileIntroduction.isPending ||
			deleteIntroduction.isPending,
		error,
		cameraDenied,
		reminder: reminder.data?.due ? reminder.data.invitation : null,
		band: optimisticBand ?? currentBand,
		menu: currentMenu,
		paidLink:
			currentMenu && "paidLink" in currentMenu
				? currentMenu.paidLink
				: undefined,
		introduction: introduction.data ?? null,
		refresh: invalidateMemberLoop,
		takeCheckIn,
		deleteCheckIn,
		chooseBand,
		fileAnIntroduction,
		takeBackIntroduction,
	};
}
