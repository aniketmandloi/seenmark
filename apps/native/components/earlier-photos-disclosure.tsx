import type { ReactNode } from "react";
import { useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
	const [expanded, setExpanded] = useState(false);

	return (
		<View style={[styles.root, { borderTopColor: borderColor }, style]}>
			<Pressable
				accessibilityRole="button"
				accessibilityState={{ expanded }}
				onPress={() => setExpanded((value) => !value)}
				style={styles.header}
			>
				<Text style={[styles.label, { color: labelColor }]}>{label}</Text>
				<Text style={[styles.action, { color: labelColor }]}>
					{expanded ? "Hide" : "Show"}
				</Text>
			</Pressable>
			{expanded ? <View style={styles.content}>{children}</View> : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingTop: 18,
		marginTop: 10,
	},
	header: {
		minHeight: 44,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	label: {
		fontSize: 16,
		fontWeight: "600",
	},
	action: {
		fontSize: 13,
		fontWeight: "600",
	},
	content: {
		paddingTop: 12,
	},
});
