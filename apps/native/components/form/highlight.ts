import { createContext } from "react";

/** Splits a title around the words its highlighter mark sits behind, or null if it has none. */
export function splitHighlight(title: string, highlight?: string) {
	const start = highlight ? title.indexOf(highlight) : -1;
	if (!highlight || start === -1) return null;

	return {
		before: title.slice(0, start),
		marked: highlight,
		after: title.slice(start + highlight.length),
	};
}

/** True inside a highlighted section, whose rows draw ink on the yellow. */
export const OnHighlight = createContext(false);
