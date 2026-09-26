import { MAX_PHOTO_BASE64_LENGTH } from "@seenmark/api/photo";

// Long enough to compare hairlines, small enough to stay under the photo limit as JPEG.
const MAX_PHOTO_EDGE = 2048;

export async function preparePhoto(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("We could not read that photo.");
  }

  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("We could not read that photo.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const imageBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  if (imageBase64.length > MAX_PHOTO_BASE64_LENGTH) {
    throw new Error("That photo is too large to keep. Try a smaller one.");
  }
  return { imageBase64, mediaType: "image/jpeg" as const };
}
