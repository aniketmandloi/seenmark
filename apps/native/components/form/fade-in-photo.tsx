import {
	Image,
	type StyleProp,
	StyleSheet,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

import { useMotion } from "@/lib/motion";

type FadeInPhotoProps = {
	uri: string;
	accessibilityLabel: string;
	/** Sizes and rounds the frame; its background is the placeholder until the photo loads. */
	style: StyleProp<ViewStyle>;
};

/**
 * A photo that fades in once it has loaded instead of popping in. A new photo needs a new key
 * so it fades in again. Nothing is ever drawn over it.
 */
export function FadeInPhoto({
	uri,
	accessibilityLabel,
	style,
}: FadeInPhotoProps) {
	const motion = useMotion();
	const opacity = useSharedValue(motion.reduced ? 1 : 0);
	const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={accessibilityLabel}
			style={[styles.frame, style]}
		>
			<Animated.View style={[StyleSheet.absoluteFill, fade]}>
				<Image
					source={{ uri }}
					style={StyleSheet.absoluteFill}
					resizeMode="cover"
					onLoad={() => {
						if (motion.reduced) return;
						opacity.value = withTiming(1, {
							duration: motion.base,
							easing: Easing.out(Easing.quad),
						});
					}}
				/>
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create({
	frame: {
		overflow: "hidden",
	},
});
