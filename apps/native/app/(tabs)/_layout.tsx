import { useQuery } from "@tanstack/react-query";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTabsAppearance } from "@/lib/native-chrome";
import { trpc } from "@/utils/trpc";

export default function MemberTabs() {
	const appearance = useTabsAppearance();
	const reminder = useQuery(trpc.checkIn.reminder.queryOptions());

	return (
		<NativeTabs {...appearance}>
			<NativeTabs.Trigger name="(check-ins)">
				<NativeTabs.Trigger.Icon
					sf={{ default: "camera", selected: "camera.fill" }}
					md="photo_camera"
				/>
				<NativeTabs.Trigger.Label>Check-ins</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Badge hidden={!reminder.data?.due} />
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="account">
				<NativeTabs.Trigger.Icon
					sf={{
						default: "person.crop.circle",
						selected: "person.crop.circle.fill",
					}}
					md="account_circle"
				/>
				<NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
