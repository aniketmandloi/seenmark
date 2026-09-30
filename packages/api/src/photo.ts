/**
 * The photos a check-in accepts. Bytes are sniffed rather than trusted from the
 * declared media type, and the size is bounded before anything is read.
 */
export const PHOTO_MEDIA_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;

export type PhotoMediaType = (typeof PHOTO_MEDIA_TYPES)[number];

export function isPhotoMediaType(value: string): value is PhotoMediaType {
	return (PHOTO_MEDIA_TYPES as readonly string[]).includes(value);
}

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export const MAX_PHOTO_BASE64_LENGTH = Math.ceil(MAX_PHOTO_BYTES / 3) * 4;

// Room for a 48-megapixel phone camera, but not for a small file that would decode
// into more pixels than a browser or phone can hold.
export const MAX_PHOTO_PIXELS = 50_000_000;

const BASE64 =
	/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function isBase64(value: string) {
	return BASE64.test(value);
}

function startsWith(
	bytes: Uint8Array,
	signature: readonly number[],
	offset = 0,
) {
	return signature.every((byte, index) => bytes[offset + index] === byte);
}

export type PhotoFrame = {
	mediaType: PhotoMediaType;
	width: number;
	height: number;
};

type Size = { width: number; height: number };

function ascii(bytes: Uint8Array, offset: number, length: number) {
	return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readPngSize(bytes: Uint8Array, view: DataView): Size | null {
	let size: Size | null = null;
	let hasImageData = false;
	let offset = 8;
	while (offset + 12 <= bytes.length) {
		const length = view.getUint32(offset);
		const type = ascii(bytes, offset + 4, 4);
		const data = offset + 8;
		const next = data + length + 4;
		if (next > bytes.length) return null;
		if (!size) {
			if (type !== "IHDR" || length !== 13) return null;
			size = { width: view.getUint32(data), height: view.getUint32(data + 4) };
		} else if (type === "IDAT") {
			hasImageData = true;
		} else if (type === "IEND") {
			return hasImageData ? size : null;
		}
		offset = next;
	}
	return null;
}

function isStartOfFrame(marker: number) {
	return (
		marker >= 0xc0 &&
		marker <= 0xcf &&
		marker !== 0xc4 &&
		marker !== 0xc8 &&
		marker !== 0xcc
	);
}

function hasEndOfImage(bytes: Uint8Array, from: number) {
	// Entropy-coded data stuffs every 0xFF with 0x00, so FF D9 only marks the end.
	for (let i = from; i + 1 < bytes.length; i++) {
		if (bytes[i] === 0xff && bytes[i + 1] === 0xd9) return true;
	}
	return false;
}

function readJpegSize(bytes: Uint8Array, view: DataView): Size | null {
	let size: Size | null = null;
	let offset = 2;
	while (offset + 4 <= bytes.length) {
		if (bytes[offset] !== 0xff) return null;
		const marker = bytes[offset + 1] ?? 0;
		if (marker === 0xff) {
			offset++;
			continue;
		}
		const length = view.getUint16(offset + 2);
		const next = offset + 2 + length;
		if (length < 2 || next > bytes.length) return null;
		if (isStartOfFrame(marker)) {
			if (length < 7) return null;
			size = {
				height: view.getUint16(offset + 5),
				width: view.getUint16(offset + 7),
			};
		} else if (marker === 0xda) {
			return size && hasEndOfImage(bytes, next) ? size : null;
		}
		offset = next;
	}
	return null;
}

function readWebpSize(bytes: Uint8Array, view: DataView): Size | null {
	const end = 8 + view.getUint32(4, true);
	if (end > bytes.length) return null;
	let canvas: Size | null = null;
	let offset = 12;
	while (offset + 8 <= end) {
		const type = ascii(bytes, offset, 4);
		const length = view.getUint32(offset + 4, true);
		const data = offset + 8;
		if (data + length > end) return null;
		if (type === "VP8X") {
			if (length < 10) return null;
			canvas = {
				width: 1 + (view.getUint32(data + 4, true) & 0xffffff),
				height: 1 + (view.getUint32(data + 6, true) >>> 8),
			};
		} else if (type === "VP8 ") {
			if (length < 10 || !startsWith(bytes, [0x9d, 0x01, 0x2a], data + 3)) {
				return null;
			}
			return (
				canvas ?? {
					width: view.getUint16(data + 6, true) & 0x3fff,
					height: view.getUint16(data + 8, true) & 0x3fff,
				}
			);
		} else if (type === "VP8L") {
			if (length < 5 || bytes[data] !== 0x2f) return null;
			const bits = view.getUint32(data + 1, true);
			return (
				canvas ?? {
					width: 1 + (bits & 0x3fff),
					height: 1 + ((bits >>> 14) & 0x3fff),
				}
			);
		}
		offset = data + length + (length % 2);
	}
	return null;
}

/**
 * Walks the photo's container to its size and checks that nothing is cut off. The
 * compressed pixels themselves are not decoded, and no score is read from them.
 */
export function readPhotoFrame(bytes: Uint8Array): PhotoFrame | null {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let mediaType: PhotoMediaType;
	let size: Size | null;
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
		mediaType = "image/jpeg";
		size = readJpegSize(bytes, view);
	} else if (
		startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
	) {
		mediaType = "image/png";
		size = readPngSize(bytes, view);
	} else if (
		startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
		startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
	) {
		mediaType = "image/webp";
		size = readWebpSize(bytes, view);
	} else {
		return null;
	}
	if (!size || size.width === 0 || size.height === 0) return null;
	return { mediaType, ...size };
}
