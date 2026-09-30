import { QueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as feedback from "@/lib/feedback";

import { useMemberActions } from "./use-member-loop";

const { transport, hooks, queryClient } = vi.hoisted(() => ({
	transport: vi.fn<(path: string, input: unknown) => Promise<unknown>>(),
	hooks: { states: [] as unknown[], cursor: 0 },
	queryClient: { current: undefined as unknown as QueryClient },
}));

// No renderer runs here, so state lives in slots taken in call order, as React keeps it.
vi.mock("react", async (importOriginal) => ({
	...(await importOriginal<typeof import("react")>()),
	useState: (initial: unknown) => {
		const slot = hooks.cursor++;
		if (!(slot in hooks.states)) hooks.states[slot] = initial;
		return [
			hooks.states[slot],
			(value: unknown) => {
				hooks.states[slot] = value;
			},
		];
	},
	useEffect: () => undefined,
	useEffectEvent: (callback: unknown) => callback,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-query")>()),
	useMutation: (options: {
		mutationFn: (input: unknown) => Promise<unknown>;
		onSuccess?: (data: unknown, input: unknown) => unknown;
	}) => ({
		isPending: false,
		mutateAsync: async (input: unknown) => {
			const data = await options.mutationFn(input);
			await options.onSuccess?.(data, input);
			return data;
		},
	}),
}));

vi.mock("@/utils/trpc", () => {
	function procedure(path: string[]) {
		return {
			pathKey: () => [path],
			queryKey: (input?: unknown) => [path, { input, type: "query" }],
			mutationOptions: (options?: object) => ({
				...options,
				mutationFn: (input: unknown) => transport(path.join("."), input),
			}),
		};
	}
	const trpc = new Proxy(
		{},
		{
			get: (_, router: string) =>
				new Proxy({}, { get: (_, name: string) => procedure([router, name]) }),
		},
	);
	return {
		trpc,
		get queryClient() {
			return queryClient.current;
		},
	};
});

vi.mock("@/lib/feedback", () => ({
	announce: vi.fn(),
	confirmChoice: vi.fn(),
	confirmDeleted: vi.fn(),
	confirmSaved: vi.fn(),
	notifyResult: vi.fn(),
}));

vi.mock("expo-image-picker", () => ({
	requestCameraPermissionsAsync: vi.fn(),
	getCameraPermissionsAsync: vi.fn(),
	launchCameraAsync: vi.fn(),
	getPendingResultAsync: vi.fn(),
}));

vi.mock("react-native", () => ({ AppState: { addEventListener: vi.fn() } }));

const bandKey = [["score", "current"], { input: undefined, type: "query" }];

function render() {
	hooks.cursor = 0;
	// biome-ignore lint/correctness/useHookAtTopLevel: the mocked hooks above stand in for a renderer.
	return useMemberActions();
}

beforeEach(() => {
	vi.clearAllMocks();
	hooks.states = [];
	queryClient.current = new QueryClient();
	transport.mockRejectedValue(new Error("Network request failed"));
});

describe("a rejected member action", () => {
	it("rolls a band back to the confirmed one and reads it again before showing the error", async () => {
		queryClient.current.setQueryData(bandKey, "early");
		let bandWhenAnnounced: unknown;
		vi.mocked(feedback.announce).mockImplementation(() => {
			bandWhenAnnounced = queryClient.current.getQueryData(bandKey);
		});

		await render().chooseBand("late");

		const actions = render();
		expect(queryClient.current.getQueryData(bandKey)).toBe("early");
		expect(bandWhenAnnounced).toBe("early");
		expect(queryClient.current.getQueryState(bandKey)?.isInvalidated).toBe(
			true,
		);
		expect(actions.error).toBe("Network request failed");
		expect(actions.savingBand).toBeUndefined();
		expect(feedback.announce).toHaveBeenCalledWith("Network request failed");
		expect(feedback.confirmChoice).not.toHaveBeenCalled();
	});

	it("resets a band that was never read", async () => {
		await render().chooseBand("mid");

		expect(queryClient.current.getQueryData(bandKey)).toBeUndefined();
		expect(render().error).toBe("Network request failed");
	});

	it("shows a failed delete and leaves it to try again", async () => {
		await expect(render().deleteCheckIn("check-in")).resolves.toBe(false);

		expect(render().error).toBe("Network request failed");
		expect(feedback.announce).toHaveBeenCalledWith("Network request failed");
		expect(feedback.confirmDeleted).not.toHaveBeenCalled();
		expect(feedback.notifyResult).not.toHaveBeenCalled();
	});

	it.each([
		["fileAnIntroduction", feedback.confirmSaved],
		["takeBackIntroduction", feedback.confirmDeleted],
	] as const)("shows a failed %s", async (action, confirm) => {
		await expect(render()[action]()).resolves.toBeUndefined();

		expect(render().error).toBe("Network request failed");
		expect(feedback.announce).toHaveBeenCalledTimes(1);
		expect(feedback.announce).toHaveBeenCalledWith("Network request failed");
		expect(confirm).not.toHaveBeenCalled();
	});

	it("shows a failed capture and records the same photo on a retry", async () => {
		vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValue({
			granted: true,
		} as ImagePicker.CameraPermissionResponse);
		vi.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({
			canceled: false,
			assets: [
				{ uri: "file://capture.jpg", base64: "AAAA", mimeType: "image/jpeg" },
			],
		} as ImagePicker.ImagePickerResult);

		await expect(render().takeCheckIn()).resolves.toBe(false);
		expect(render().error).toBe("Network request failed");
		expect(feedback.announce).toHaveBeenCalledWith("Network request failed");
		expect(feedback.confirmSaved).not.toHaveBeenCalled();

		transport.mockResolvedValue({
			id: "check-in",
			takenAt: new Date().toISOString(),
		});
		await expect(render().takeCheckIn()).resolves.toBe(true);
		expect(transport).toHaveBeenCalledTimes(2);
		expect(render().error).toBeNull();
		expect(feedback.confirmSaved).toHaveBeenCalledTimes(1);
	});
});
