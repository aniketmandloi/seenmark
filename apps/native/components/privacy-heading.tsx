import type { ColorValue } from "react-native";
import { Text } from "react-native";

type PrivacyHeadingProps = {
	label: string;
	color: ColorValue;
};

export function PrivacyHeading({ label, color }: PrivacyHeadingProps) {
	return (
		<Text style={{ color, fontSize: 19, fontWeight: "600", marginBottom: 8 }}>
			{label}
		</Text>
	);
}
