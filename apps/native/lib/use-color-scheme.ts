import { useColorScheme as useRNColorScheme } from "react-native";

import { NAV_THEME } from "@/lib/constants";

export function useColorScheme() {
	const colorScheme: "light" | "dark" =
		useRNColorScheme() === "dark" ? "dark" : "light";

	return {
		colorScheme,
		isDarkColorScheme: colorScheme === "dark",
		theme: NAV_THEME[colorScheme],
	};
}
