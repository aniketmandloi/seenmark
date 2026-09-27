import { useMemo } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

import { FadeInPhoto } from "@/components/form/fade-in-photo";
import type { FormPhoto } from "@/components/form/types";
import { useColorScheme } from "@/lib/use-color-scheme";

type ComparedPhotosProps = {
	earlier: FormPhoto;
	latest: FormPhoto;
	/** Where the divider sits, in percent of the frame's width from the leading edge. */
	position: number;
	/** Sizes and rounds the frame; its background is the placeholder until the photos load. */
	style: StyleProp<ViewStyle>;
};

/**
 * Two photos stacked in one frame: the earlier one whole, the latest one to the right of a
 * divider. Nothing but the divider is ever drawn over them.
 */
export function ComparedPhotos({
	earlier,
	latest,
	position,
	style,
}: ComparedPhotosProps) {
	const { theme } = useColorScheme();
	const earlierPhoto = usePhoto(earlier);
	const latestPhoto = usePhoto(latest);

	// The clip slides right with the divider and the photo inside slides back by the same
	// share of the frame, so the latest photo stays put and only its visible part changes.
	return (
		<View style={[styles.frame, style]}>
			{earlierPhoto}
			<View
				style={[
					StyleSheet.absoluteFill,
					styles.clip,
					{ transform: [{ translateX: `${position}%` }] },
				]}
			>
				<View
					style={[
						StyleSheet.absoluteFill,
						{ transform: [{ translateX: `${-position}%` }] },
					]}
				>
					{latestPhoto}
				</View>
			</View>
			<View
				style={[
					styles.divider,
					{ left: `${position}%`, backgroundColor: theme.background },
				]}
			/>
		</View>
	);
}

// The photos are large data URIs; handing React the same element lets it skip them while
// the divider moves.
function usePhoto({ id, uri, accessibilityLabel }: FormPhoto) {
	return useMemo(
		() => (
			<FadeInPhoto
				key={id}
				uri={uri}
				accessibilityLabel={accessibilityLabel}
				style={StyleSheet.absoluteFill}
			/>
		),
		[id, uri, accessibilityLabel],
	);
}

const styles = StyleSheet.create({
	frame: {
		overflow: "hidden",
	},
	clip: {
		overflow: "hidden",
	},
	divider: {
		position: "absolute",
		top: 0,
		bottom: 0,
		width: 2,
		marginLeft: -1,
	},
});
