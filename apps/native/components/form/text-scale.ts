import { useWindowDimensions } from "react-native";

// iOS accessibility text sizes start near 1.8×, Android's largest font scale is 2×; past this a
// row's value no longer fits beside its title.
const STACKED_FROM = 1.7;

/** Whether text is so large that a row's value should sit under its title, not beside it. */
export function useStackedRows() {
	return useWindowDimensions().fontScale >= STACKED_FROM;
}
