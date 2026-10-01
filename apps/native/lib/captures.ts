import { Directory, File, Paths } from "expo-file-system";

// A file left behind is only a private cache entry the OS evicts in time, so a failed
// delete must never fail the check-in or the sign-out that triggered it.
function tryDelete(entry: File | Directory) {
	try {
		if (entry.exists) entry.delete();
	} catch {}
}

/** Deletes a photo file the camera returned, once its contents have been read. */
export function discardCapture(uri: string) {
	tryDelete(new File(uri));
}

/**
 * Deletes every camera file still on the device, including ones from a camera session the
 * app never got back. Not run at start-up: on Android a capture from a destroyed app is
 * still waiting there to be recovered.
 */
export function discardAllCaptures() {
	try {
		// ImagePicker writes every capture here, on iOS and Android alike.
		const captures = new Directory(Paths.cache, "ImagePicker");
		if (!captures.exists) return;
		for (const entry of captures.list()) tryDelete(entry);
	} catch {}
}
