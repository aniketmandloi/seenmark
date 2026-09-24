/** Check-ins per history read, kept apart from the router so clients can import it. */
export const HISTORY_PAGE_SIZE = 30;

type HistoryItem = { id: string; takenAt: string };

/** The cursor for the page after this one, or undefined when this was the last. */
export function nextHistoryCursor(page: readonly HistoryItem[]) {
	const last = page.at(-1);
	return page.length === HISTORY_PAGE_SIZE && last
		? { takenAt: last.takenAt, id: last.id }
		: undefined;
}
