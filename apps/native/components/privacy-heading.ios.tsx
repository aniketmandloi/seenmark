import { Host, Label } from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import type { ColorValue } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type PrivacyHeadingProps = {
	label: string;
	color: ColorValue;
};

export function PrivacyHeading({ label, color }: PrivacyHeadingProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={{ marginBottom: 8 }}
		>
			<Label
				title={label}
				systemImage="lock.shield.fill"
				modifiers={[
					font({ size: 19, weight: "semibold" }),
					foregroundStyle(color),
				]}
			/>
		</Host>
	);
}
