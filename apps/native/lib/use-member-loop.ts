import type { Band } from "@seenmark/api/bands";
import { HISTORY_PAGE_SIZE, nextHistoryCursor } from "@seenmark/api/history";
import { isPhotoMediaType, MAX_PHOTO_BASE64_LENGTH } from "@seenmark/api/photo";
import {
	type QueryKey,
	useInfiniteQuery,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useEffectEvent, useState } from "react";
import { AppState } from "react-native";

import { discardCapture } from "@/lib/captures";
import {
	announce,
	confirmChoice,
	confirmDeleted,
	confirmSaved,
	notifyResult,
} from "@/lib/feedback";
import { captureMemberSession } from "@/lib/member-session";
import { queryClient, trpc } from "@/utils/trpc";

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
		isRefreshing: checkIns.isFetching || band.isFetching,
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
		isRefreshing: menu.isFetching || introduction.isFetching,
		menu: currentMenu,
		paidLink:
			currentMenu && "paidLink" in currentMenu
				? currentMenu.paidLink
				: undefined,
		introduction: introduction.data ?? null,
		refresh: () => refresh(menuKey, introductionKey),
	};
}

// Camera files already saved as check-ins in this run, so one capture is never recorded twice.
const recordedCaptures = new Set<string>();
let pendingCaptureChecked = false;

/** The actions that change the member loop; each refreshes only the reads it can change. */
export function useMemberActions() {
	const [error, setError] = useState<string | null>(null);
	const [cameraDenied, setCameraDenied] = useState(false);

	// The error row appears away from where the member is, so a screen reader hears it too.
	function fail(message: string) {
		setError(message);
		announce(message);
	}

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

	const record = useMutation(
		trpc.checkIn.record.mutationOptions({
			onMutate: captureMemberSession,
			// Stays pending until the record lists the new check-in, so the saving placeholder
			// hands straight over to its photo, which is seeded rather than downloaded back.
			onSuccess: (saved, { imageBase64, mediaType }, stillCurrent) => {
				if (!stillCurrent()) return;
				queryClient.setQueryData(
					trpc.checkIn.photo.queryKey({ id: saved.id }),
					{ ...saved, imageBase64, mediaType },
				);
				return refresh(checkInsKey, reminderKey);
			},
		}),
	);
	const remove = useMutation(
		trpc.checkIn.delete.mutationOptions({
			onMutate: captureMemberSession,
			// Stays pending until the reads it changes are refreshed, so a delete button cannot
			// be pressed again while the check-in is still listed.
			onSuccess: async (_, { id }, stillCurrent) => {
				if (!stillCurrent()) return;
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
			},
		}),
	);
	const choose = useMutation(trpc.score.choose.mutationOptions());
	// A mutation stays pending until its onSuccess settles, so an introduction button stays
	// pending until the changed request shows.
	const fileIntroduction = useMutation(
		trpc.introduction.file.mutationOptions({
			onMutate: captureMemberSession,
			onSuccess: async (_, __, stillCurrent) => {
				if (stillCurrent()) await refresh(introductionKey);
			},
		}),
	);
	const deleteIntroduction = useMutation(
		trpc.introduction.delete.mutationOptions({
			onMutate: captureMemberSession,
			onSuccess: async (_, __, stillCurrent) => {
				if (stillCurrent()) await refresh(introductionKey);
			},
		}),
	);

	/** Records the photo from a finished camera session, once per captured file. */
	async function recordCapture(
		result: ImagePicker.ImagePickerResult,
		stillCurrent: () => boolean,
	) {
		if (result.canceled) return false;

		const asset = result.assets[0];
		// The photo arrives already read into base64, and a retry takes a new one, so its
		// file is deleted whether it is saved, rejected or fails to upload.
		try {
			if (!asset?.base64) {
				fail("The camera did not return a photo. Please try again.");
				return false;
			}
			if (recordedCaptures.has(asset.uri)) return false;
			const mediaType = asset.mimeType ?? "image/jpeg";
			if (!isPhotoMediaType(mediaType)) {
				fail("The camera returned a photo format Seenmark cannot keep.");
				return false;
			}
			if (asset.base64.length > MAX_PHOTO_BASE64_LENGTH) {
				fail("That photo is too large to keep. Please try again.");
				return false;
			}

			recordedCaptures.add(asset.uri);
			try {
				await record.mutateAsync({
					imageBase64: asset.base64,
					mediaType,
					takenAt: new Date().toISOString(),
				});
			} catch (cause) {
				recordedCaptures.delete(asset.uri);
				throw cause;
			}
		} finally {
			if (asset) discardCapture(asset.uri);
		}
		if (!stillCurrent()) return false;
		confirmSaved();
		notifyResult("Check-in saved");
		return true;
	}

	// Android can destroy the app while the camera is open; the finished capture is then
	// handed over on the next start instead of to launchCameraAsync.
	const recoverPendingCapture = useEffectEvent(async () => {
		const stillCurrent = captureMemberSession();
		try {
			const pending = await ImagePicker.getPendingResultAsync();
			if (!pending) return;
			if ("code" in pending) {
				fail(
					pending.message || "The camera could not finish. Please try again.",
				);
				return;
			}
			await recordCapture(pending, stillCurrent);
		} catch (cause) {
			if (stillCurrent()) fail(messageFrom(cause, "Failed to record check-in"));
		}
	});

	useEffect(() => {
		if (pendingCaptureChecked) return;
		pendingCaptureChecked = true;
		void recoverPendingCapture();
	}, []);

	/** Resolves true once a new check-in is saved. */
	async function takeCheckIn() {
		const stillCurrent = captureMemberSession();
		setError(null);
		setCameraDenied(false);
		try {
			const permission = await ImagePicker.requestCameraPermissionsAsync();
			if (!permission.granted) {
				setCameraDenied(true);
				announce("Camera access is needed for a check-in.");
				return false;
			}

			return await recordCapture(
				await ImagePicker.launchCameraAsync({
					mediaTypes: ["images"],
					allowsEditing: false,
					base64: true,
					// Full-quality camera JPEGs can exceed the upload limit; this keeps detail for comparing.
					quality: 0.6,
				}),
				stillCurrent,
			);
		} catch (cause) {
			if (stillCurrent()) fail(messageFrom(cause, "Failed to record check-in"));
			return false;
		}
	}

	async function deleteCheckIn(id: string) {
		const stillCurrent = captureMemberSession();
		setError(null);
		try {
			await remove.mutateAsync({ id });
			if (!stillCurrent()) return false;
			confirmDeleted();
			notifyResult("Check-in deleted");
			return true;
		} catch (cause) {
			if (stillCurrent()) fail(messageFrom(cause, "Failed to delete check-in"));
			return false;
		}
	}

	const [savingBand, setSavingBand] = useState<Band>();

	async function chooseBand(band: Band) {
		const stillCurrent = captureMemberSession();
		setError(null);
		setSavingBand(band);
		await queryClient.cancelQueries({ queryKey: bandKey });
		const confirmed = queryClient.getQueryData<Band | null>(bandKey);
		queryClient.setQueryData(bandKey, band);
		try {
			await choose.mutateAsync(band);
			if (!stillCurrent()) return;
			confirmChoice();
			await forgetMenu();
		} catch (cause) {
			if (!stillCurrent()) return;
			// Back to the last confirmed band first, so neither a failed recovery read nor
			// presenting the error can leave the rejected band selected. setQueryData ignores
			// undefined, so a band that was never read is reset instead.
			if (confirmed === undefined) {
				queryClient.removeQueries({ queryKey: bandKey, exact: true });
			} else {
				queryClient.setQueryData(bandKey, confirmed);
			}
			// The change may still have been saved before the reply was lost, so both the
			// band and its menu are read again.
			await Promise.all([refresh(bandKey), forgetMenu()]);
			if (stillCurrent()) fail(messageFrom(cause, "Failed to save your band"));
		} finally {
			// Cleared only once the band has settled, so FormChoice can tell a save from a rollback.
			setSavingBand(undefined);
		}
	}

	async function fileAnIntroduction() {
		const stillCurrent = captureMemberSession();
		setError(null);
		try {
			await fileIntroduction.mutateAsync();
			if (!stillCurrent()) return;
			confirmSaved();
			announce("Introduction request saved");
		} catch (cause) {
			if (stillCurrent())
				fail(messageFrom(cause, "Failed to file an introduction"));
		}
	}

	async function takeBackIntroduction() {
		const stillCurrent = captureMemberSession();
		setError(null);
		try {
			await deleteIntroduction.mutateAsync();
			if (!stillCurrent()) return;
			confirmDeleted();
			announce("Introduction request deleted");
		} catch (cause) {
			if (stillCurrent())
				fail(messageFrom(cause, "Failed to delete the introduction"));
		}
	}

	return {
		isRecording: record.isPending,
		isDeleting: remove.isPending,
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
		/** The band being saved, until the choice has settled either way. */
		savingBand,
		fileAnIntroduction,
		isFiling: fileIntroduction.isPending,
		takeBackIntroduction,
		isDeletingIntroduction: deleteIntroduction.isPending,
	};
}
