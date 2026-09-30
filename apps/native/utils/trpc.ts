import type { AppRouter } from "@seenmark/api/routers/index";
import { QueryClient } from "@tanstack/react-query";
import {
	createTRPCClient,
	httpBatchLink,
	httpLink,
	splitLink,
} from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

import { ENV } from "../src/env";

export const queryClient = new QueryClient();

const url = `${ENV.EXPO_PUBLIC_SERVER_URL}/trpc`;

const fetchWithCookies = (input: RequestInfo | URL, options?: RequestInit) =>
	fetch(input, {
		...options,
		// Better Auth Expo forwards the session cookie manually on native.
		credentials: Platform.OS === "web" ? "include" : "omit",
	});

async function headers() {
	if (Platform.OS === "web") {
		return {};
	}
	const headers = new Map<string, string>();
	const cookies = await authClient.getCookie();
	if (cookies) {
		headers.set("Cookie", cookies);
	}
	return Object.fromEntries(headers);
}

const trpcClient = createTRPCClient<AppRouter>({
	links: [
		// A photo is up to 4 MiB as base64, so two in one batched response pass Vercel's 4.5 MB cap.
		splitLink({
			condition: (op) => op.path === "checkIn.photo",
			true: httpLink({ url, fetch: fetchWithCookies, headers }),
			false: httpBatchLink({ url, fetch: fetchWithCookies, headers }),
		}),
	],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
	client: trpcClient,
	queryClient,
});
