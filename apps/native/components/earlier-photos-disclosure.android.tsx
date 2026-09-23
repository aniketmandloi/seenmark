import {
	Column,
	Text as ComposeText,
	Host,
	RNHostView,
	Row,
	TextButton,
} from "@expo/ui/jetpack-compose";
import type { ReactNode } from "react";
import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

type EarlierPhotosDisclosureProps = {
	label: string;
	labelColor: string;
	borderColor: string;
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
			<Column>
				<Row horizontalArrangement="spaceBetween" verticalAlignment="center">
					<ComposeText
						color={labelColor}
						style={{ fontSize: 16, fontWeight: "600" }}
					>
						{label}
					</ComposeText>
					<TextButton
						colors={{ contentColor: labelColor }}
						onClick={() => setExpanded((value) => !value)}
					>
						<ComposeText>{expanded ? "Hide" : "Show"}</ComposeText>
					</TextButton>
				</Row>
				{expanded ? (
					<RNHostView matchContents>
						<View style={{ paddingTop: 12 }}>{children}</View>
					</RNHostView>
				) : null}
			</Column>
		</Host>
	);
}
