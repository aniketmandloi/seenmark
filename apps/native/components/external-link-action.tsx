import * as ExpoLinking from "expo-linking";

import { NativeButton } from "@/components/native-button";

type ExternalLinkActionProps = {
	destination: string;
};

export function ExternalLinkAction({ destination }: ExternalLinkActionProps) {
	return (
		<NativeButton
			label="Open link"
			variant="outlined"
			onPress={() => void ExpoLinking.openURL(destination)}
		/>
	);
}
