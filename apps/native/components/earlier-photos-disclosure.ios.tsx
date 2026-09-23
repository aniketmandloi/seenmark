import { DisclosureGroup, Host, RNHostView } from "@expo/ui/swift-ui";
import { foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import type { ReactNode } from "react";
import { useState } from "react";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type EarlierPhotosDisclosureProps = {
	label: string;
	labelColor: ColorValue;
	borderColor: ColorValue;
	style?: StyleProp<ViewStyle>;
	children: ReactNode;
};

export function EarlierPhotosDisclosure({
	label,
	labelColor,
	borderColor,
	style,
	children,
}: EarlierPhotosDisclosureProps) {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const [expanded, setExpanded] = useState(false);

	return (
		<Host
			colorScheme={colorScheme}
			seedColor={theme.primary}
			matchContents={{ vertical: true }}
			style={[
				{
					borderTopColor: borderColor,
					borderTopWidth: 0.5,
					paddingTop: 18,
					marginTop: 10,
				},
				style,
			]}
		>
			<DisclosureGroup
				label={label}
				isExpanded={expanded}
				onIsExpandedChange={setExpanded}
				modifiers={[foregroundStyle(labelColor)]}
			>
				<RNHostView matchContents>
					<View style={{ paddingTop: 12 }}>{children}</View>
				</RNHostView>
			</DisclosureGroup>
		</Host>
	);
}
