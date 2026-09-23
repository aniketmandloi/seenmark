import { Text as ExpoText, Host, Picker } from "@expo/ui/swift-ui";
import { disabled, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import type { ColorValue, StyleProp, ViewStyle } from "react-native";

type Option = { value: string; label: string };

type BandPickerProps = {
	options: Option[];
	selection: string | null;
	enabled: boolean;
	tintColor: ColorValue;
	appearance: "light" | "dark";
	style?: StyleProp<ViewStyle>;
	onSelectionChange: (value: string) => void;
};

export function BandPicker({
	options,
	selection,
	enabled,
	tintColor,
	appearance,
	style,
	onSelectionChange,
}: BandPickerProps) {
	return (
		<Host
			colorScheme={appearance}
			seedColor={tintColor}
			matchContents={{ vertical: true }}
			style={[{ width: "100%" }, style]}
		>
			<Picker
				selection={selection}
				onSelectionChange={(value) => {
					if (value !== null) onSelectionChange(value);
				}}
				modifiers={[
					pickerStyle("segmented"),
					...(enabled ? [] : [disabled(true)]),
				]}
			>
				{options.map((option) => (
					<ExpoText key={option.value} modifiers={[tag(option.value)]}>
						{option.label}
					</ExpoText>
				))}
			</Picker>
		</Host>
	);
}
