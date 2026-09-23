import { Checkbox as ExpoCheckbox, Host } from "@expo/ui";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export function NativeCheckbox({
	label,
	value,
	onValueChange,
}: {
	label: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={{ minHeight: 42, justifyContent: "center" }}
		>
			<ExpoCheckbox label={label} value={value} onValueChange={onValueChange} />
		</Host>
	);
}
