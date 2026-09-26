/** Where a pointer sits across the slider frame, as a whole percentage from its left edge. */
export function dividerPercent(clientX: number, frame: { left: number; width: number }) {
  if (frame.width <= 0) return 50;
  const percent = ((clientX - frame.left) / frame.width) * 100;
  return Math.round(Math.min(100, Math.max(0, percent)));
}
