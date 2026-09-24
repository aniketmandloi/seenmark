import { HISTORY_PAGE_SIZE, nextHistoryCursor } from "@seenmark/api/history";
import {
	isPhotoMediaType,
	MAX_PHOTO_BASE64_LENGTH,
} from "@seenmark/api/photo";
import {
	type QueryKey,
	useInfiniteQuery,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

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

export type CheckInPhoto = {
	id: string;
	takenAt: string;
	mediaType: string;
	imageBase64: string;
};

export function checkInPhotoUri(checkIn: CheckInPhoto) {
	return `data:${checkIn.mediaType};base64,${checkIn.imageBase64}`;
}

/** A recorded photo never changes, so once loaded it is never refetched. */
export function checkInPhotoQuery(id: string) {
	return trpc.checkIn.photo.queryOptions(
		{ id },
		{
			staleTime: Number.POSITIVE_INFINITY,
			// A deleted photo stays deleted; only a failed read is worth repeating.
			retry: (failures, error) =>
				error.data?.code !== "NOT_FOUND" && failures < 3,
		},
	);
}

function messageFrom(cause: unknown, fallback: string) {
	return cause instanceof Error ? cause.message : fallback;
}

async function refresh(...queryKeys: QueryKey[]) {
	await Promise.all(
		queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
	);
}

// Loaded photos never go stale, so a refresh only sends again the ones that failed.
function retryFailedPhotos() {
	return queryClient.refetchQueries({
		queryKey: trpc.checkIn.photo.pathKey(),
		predicate: (query) => query.state.status === "error",
	});
}

const checkInsKey = trpc.checkIn.list.pathKey();
const reminderKey = trpc.checkIn.reminder.queryKey();
const bandKey = trpc.score.current.queryKey();
const menuKey = trpc.menu.current.queryKey();
const introductionKey = trpc.introduction.current.queryKey();

// A menu belongs to one band, so a changed band drops it rather than showing it stale.
function forgetMenu() {
	return queryClient.resetQueries({ queryKey: menuKey });
}

/** The check-ins screen: the photo record, the reminder, the chosen band and whether an introduction is saved. */
export function useCheckIns() {
	const checkIns = useInfiniteQuery(
		trpc.checkIn.list.infiniteQueryOptions(
			{ limit: HISTORY_PAGE_SIZE },
			{ getNextPageParam: nextHistoryCursor },
		),
	);
	const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
	const band = useQuery(trpc.score.current.queryOptions());
	const introduction = useQuery(trpc.introduction.current.queryOptions());
	const items = checkIns.data?.pages.flat() ?? [];

	return {
		items,
		// A failed read is not an empty record: it must not invite a first photo or hide the band.
		loadFailed: checkIns.isError || band.isError,
		hasEarlier: checkIns.hasNextPage,
		isLoadingEarlier: checkIns.isFetchingNextPage,
		loadEarlier: () => void checkIns.fetchNextPage(),
		isLoading: checkIns.isLoading,
		isEmpty: checkIns.isSuccess && items.length === 0,
		reminder: reminder.data?.due ? reminder.data.invitation : null,
		band: band.data ?? null,
		hasIntroduction: Boolean(introduction.data),
		refresh: () =>
			Promise.all([
				refresh(checkInsKey, reminderKey, bandKey, introductionKey),
				retryFailedPhotos(),
			]).then(() => undefined),
	};
}

/** The next-steps screen: the menu for the chosen band and any introduction. */
export function useNextSteps() {
	const menu = useQuery(trpc.menu.current.queryOptions());
	const introduction = useQuery(trpc.introduction.current.queryOptions());
	const currentMenu = menu.data?.menu ?? null;

	return {
		isLoading: menu.isLoading || introduction.isLoading,
		loadFailed: menu.isError || introduction.isError,
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

	// Camera access is usually granted in the device settings, so coming back to the app
	// checks again rather than waiting for another tap.
	useEffect(() => {
		if (!cameraDenied) return;
		const subscription = AppState.addEventListener("change", (state) => {
			if (state !== "active") return;
			void ImagePicker.getCameraPermissionsAsync().then((permission) => {
				if (permission.granted) setCameraDenied(false);
			});
		});
		return () => subscription.remove();
	}, [cameraDenied]);

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
				// Full-quality camera JPEGs can pass the upload limit; this keeps detail for comparing.
				quality: 0.6,
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
			if (asset.base64.length > MAX_PHOTO_BASE64_LENGTH) {
				setError("That photo is too large to keep. Please try again.");
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
			// The photo never goes stale, so it stays readable until evicted; a read still
			// in flight is cancelled so it cannot put the photo back.
			const photoKey = trpc.checkIn.photo.queryKey({ id });
			await queryClient.cancelQueries({ queryKey: photoKey });
			queryClient.removeQueries({ queryKey: photoKey });
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
		const confirmed = queryClient.getQueryData<Band | null>(bandKey);
		queryClient.setQueryData(bandKey, band);
		try {
			await choose.mutateAsync(band);
			await forgetMenu();
		} catch (cause) {
			setError(messageFrom(cause, "Failed to save your band"));
			// Back to the last confirmed band first, so a failed recovery read cannot leave
			// the rejected band selected. setQueryData ignores undefined, so a band that was
			// never read is reset instead.
			if (confirmed === undefined) {
				queryClient.removeQueries({ queryKey: bandKey, exact: true });
			} else {
				queryClient.setQueryData(bandKey, confirmed);
			}
			// The change may still have been saved before the reply was lost, so both the
			// band and its menu are read again.
			await Promise.all([refresh(bandKey), forgetMenu()]);
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
