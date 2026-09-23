import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { authClient } from "@/lib/auth-client";
import { NAV_THEME } from "@/lib/constants";
import { useColorScheme } from "@/lib/use-color-scheme";

export default function MemberTabs() {
	const { colorScheme } = useColorScheme();
	const theme = colorScheme === "dark" ? NAV_THEME.dark : NAV_THEME.light;
	const { data: session } = authClient.useSession();

	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: theme.background },
				headerTitleStyle: { color: theme.text, fontWeight: "600" },
				headerTintColor: theme.text,
				tabBarStyle: {
					backgroundColor: theme.background,
					borderTopColor: theme.border,
				},
				tabBarActiveTintColor: theme.primary,
				tabBarInactiveTintColor: theme.muted,
				tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Check-ins",
					tabBarLabel: "Check-ins",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="camera-outline" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="account"
				options={{
					title: "Account",
					tabBarLabel: "Account",
					href: session?.user ? undefined : null,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person-circle-outline" color={color} size={size} />
					),
				}}
			/>
		</Tabs>
	);
}
