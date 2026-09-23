import { SegmentedControl } from "@expo/ui/community/segmented-control";
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
		<SegmentedControl
			values={options.map((option) => option.label)}
			selectedIndex={
				selection
					? options.findIndex((option) => option.value === selection)
					: undefined
			}
			enabled={enabled}
			tintColor={tintColor}
			appearance={appearance}
			style={style}
			onValueChange={(label) => {
				const option = options.find((item) => item.label === label);
				if (option) onSelectionChange(option.value);
			}}
		/>
	);
}
