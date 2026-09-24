/**
 * The photos a check-in accepts. Bytes are sniffed rather than trusted from the
 * declared media type, and the size is bounded before anything is decoded.
 */
export const PHOTO_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type PhotoMediaType = (typeof PHOTO_MEDIA_TYPES)[number];

export function isPhotoMediaType(value: string): value is PhotoMediaType {
	return (PHOTO_MEDIA_TYPES as readonly string[]).includes(value);
}

export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export const MAX_PHOTO_BASE64_LENGTH = Math.ceil(MAX_PHOTO_BYTES / 3) * 4;

const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export function isBase64(value: string) {
	return BASE64.test(value);
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0) {
	return signature.every((byte, index) => bytes[offset + index] === byte);
}

export function sniffPhotoType(bytes: Uint8Array): PhotoMediaType | null {
	if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
	if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
		return "image/png";
	}
	if (
		startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
		startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
	) {
		return "image/webp";
	}
	return null;
}
