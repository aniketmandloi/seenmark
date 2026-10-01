import { File } from "expo-file-system";

// A file left behind is only a private cache entry the OS evicts in time, so a failed
// delete must never fail the check-in that triggered it.
function tryDelete(entry: File) {
	try {
		if (entry.exists) entry.delete();
	} catch {}
}

/** Deletes a photo file the camera returned, once its contents have been read. */
export function discardCapture(uri: string) {
	tryDelete(new File(uri));
}
