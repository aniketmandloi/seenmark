import type { CheckIn } from "./check-in-dates";

export type Slot = "earlier" | "latest";

/** The member's picks for each slot; null means "use the default". */
export type ComparisonChoice = { earlierId: string | null; latestId: string | null };

export const defaultChoice: ComparisonChoice = { earlierId: null, latestId: null };

/**
 * The two check-ins to compare, newest against the one before it unless the member picked
 * others. A pick that is no longer loaded (it was deleted) falls back, and the two slots never
 * hold the same check-in.
 */
export function resolveComparison<T extends CheckIn>(
  items: readonly T[],
  choice: ComparisonChoice,
) {
  const find = (id: string | null) => items.find((item) => item.id === id);
  const latest = find(choice.latestId) ?? items[0];
  const chosenEarlier = find(choice.earlierId);
  if (chosenEarlier && chosenEarlier !== latest) {
    return { earlier: chosenEarlier, latest };
  }
  const index = latest ? items.indexOf(latest) : -1;
  return { earlier: items[index + 1] ?? items[index - 1], latest };
}

/** Puts a check-in in one slot; if it already sits in the other one, the two swap. */
export function chooseSlot(
  current: { earlier?: CheckIn; latest?: CheckIn },
  slot: Slot,
  id: string,
): ComparisonChoice {
  const earlierId = current.earlier?.id ?? null;
  const latestId = current.latest?.id ?? null;
  if (slot === "earlier") {
    return { earlierId: id, latestId: id === latestId ? earlierId : latestId };
  }
  return { earlierId: id === earlierId ? latestId : earlierId, latestId: id };
}

/** Where a pointer sits across the slider frame, as a whole percentage from its left edge. */
export function dividerPercent(clientX: number, frame: { left: number; width: number }) {
  if (frame.width <= 0) return 50;
  const percent = ((clientX - frame.left) / frame.width) * 100;
  return Math.round(Math.min(100, Math.max(0, percent)));
}
