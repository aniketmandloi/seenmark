import { Host, Link } from "@expo/ui/swift-ui";
import {
	buttonBorderShape,
	buttonStyle,
	controlSize,
} from "@expo/ui/swift-ui/modifiers";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type ExternalLinkActionProps = {
	destination: string;
};

export function ExternalLinkAction({ destination }: ExternalLinkActionProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={{ minHeight: 46, justifyContent: "center" }}
		>
			<Link
				label="Open link"
				destination={destination}
				modifiers={[
					buttonStyle("bordered"),
					buttonBorderShape("roundedRectangle", 14),
					controlSize("regular"),
				]}
			/>
		</Host>
	);
}
