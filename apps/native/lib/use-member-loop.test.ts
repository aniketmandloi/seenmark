import { QueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as feedback from "@/lib/feedback";
import { claimMemberCache, forgetMemberData } from "@/lib/member-session";

import { useMemberActions } from "./use-member-loop";

const { transport, hooks, queryClient, files } = vi.hoisted(() => ({
	transport: vi.fn<(path: string, input: unknown) => Promise<unknown>>(),
	hooks: { states: [] as unknown[], cursor: 0 },
	queryClient: { current: undefined as unknown as QueryClient },
	files: new Set<string>(),
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
		onMutate?: (input: unknown) => unknown;
		onSuccess?: (data: unknown, input: unknown, started: unknown) => unknown;
	}) => ({
		isPending: false,
		mutateAsync: async (input: unknown) => {
			const started = await options.onMutate?.(input);
			const data = await options.mutationFn(input);
			await options.onSuccess?.(data, input, started);
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

// The device's files, as a set of URIs.
vi.mock("expo-file-system", () => {
	class File {
		constructor(readonly uri: string) {}
		get exists() {
			return files.has(this.uri);
		}
		delete() {
			files.delete(this.uri);
		}
	}
	class Directory {
		readonly uri: string;
		constructor(...parts: (string | Directory)[]) {
			this.uri = parts.map(String).join("/");
		}
		toString() {
			return this.uri;
		}
		get exists() {
			return true;
		}
		list() {
			return [...files]
				.filter((uri) => uri.startsWith(`${this.uri}/`))
				.map((uri) => new File(uri));
		}
	}
	return { File, Directory, Paths: { cache: new Directory("file://cache") } };
});

const bandKey = [["score", "current"], { input: undefined, type: "query" }];
const checkInsKey = [["checkIn", "list"]];
const introductionKey = [
	["introduction", "current"],
	{ input: undefined, type: "query" },
];

function capture(uri: string) {
	vi.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValue({
		granted: true,
	} as ImagePicker.CameraPermissionResponse);
	vi.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({
		canceled: false,
		assets: [{ uri, base64: "AAAA", mimeType: "image/jpeg" }],
	} as ImagePicker.ImagePickerResult);
}

// The reply is held back until the test settles it, as a slow network would.
function holdReply() {
	let settle = {
		resolve: (_: unknown) => {},
		reject: (_: unknown) => {},
	};
	transport.mockReturnValueOnce(
		new Promise((resolve, reject) => {
			settle = { resolve, reject };
		}),
	);
	return settle;
}

function switchToMemberB() {
	claimMemberCache(null);
	claimMemberCache("member-b");
}

function render() {
	hooks.cursor = 0;
	// biome-ignore lint/correctness/useHookAtTopLevel: the mocked hooks above stand in for a renderer.
	return useMemberActions();
}

beforeEach(() => {
	vi.clearAllMocks();
	files.clear();
	hooks.states = [];
	queryClient.current = new QueryClient();
	claimMemberCache("member-a");
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

describe("a reply that arrives after its member has left", () => {
	it("does not seed a recorded photo or confirm it to the next member", async () => {
		capture("file://late-capture.jpg");
		const reply = holdReply();
		const saving = render().takeCheckIn();
		await vi.waitFor(() => expect(transport).toHaveBeenCalled());

		switchToMemberB();
		queryClient.current.setQueryData(checkInsKey, "b's check-ins");
		reply.resolve({ id: "a-check-in", takenAt: new Date().toISOString() });

		await expect(saving).resolves.toBe(false);
		expect(queryClient.current.getQueryCache().getAll()).toHaveLength(1);
		expect(queryClient.current.getQueryState(checkInsKey)?.isInvalidated).toBe(
			false,
		);
		expect(feedback.confirmSaved).not.toHaveBeenCalled();
		expect(feedback.notifyResult).not.toHaveBeenCalled();
	});

	it("does not refresh or confirm a delete to the next member", async () => {
		const reply = holdReply();
		const deleting = render().deleteCheckIn("a-check-in");

		switchToMemberB();
		queryClient.current.setQueryData(checkInsKey, "b's check-ins");
		reply.resolve(undefined);

		await expect(deleting).resolves.toBe(false);
		expect(queryClient.current.getQueryState(checkInsKey)?.isInvalidated).toBe(
			false,
		);
		expect(feedback.confirmDeleted).not.toHaveBeenCalled();
	});

	it("does not roll the next member's band back or show them the error", async () => {
		queryClient.current.setQueryData(bandKey, "early");
		const reply = holdReply();
		const choosing = render().chooseBand("late");
		await vi.waitFor(() => expect(transport).toHaveBeenCalled());

		switchToMemberB();
		queryClient.current.setQueryData(bandKey, "mid");
		reply.reject(new Error("Network request failed"));
		await choosing;

		expect(queryClient.current.getQueryData(bandKey)).toBe("mid");
		expect(queryClient.current.getQueryState(bandKey)?.isInvalidated).toBe(
			false,
		);
		expect(render().error).toBeNull();
		expect(feedback.announce).not.toHaveBeenCalled();
	});

	it("does not refresh or announce an introduction to the next member", async () => {
		const reply = holdReply();
		const filing = render().fileAnIntroduction();

		switchToMemberB();
		queryClient.current.setQueryData(introductionKey, null);
		reply.resolve({ id: "a-introduction" });
		await filing;

		expect(
			queryClient.current.getQueryState(introductionKey)?.isInvalidated,
		).toBe(false);
		expect(feedback.confirmSaved).not.toHaveBeenCalled();
		expect(feedback.announce).not.toHaveBeenCalled();
	});

	it("does not put a read into the next member's cache", async () => {
		let resolveRead: (value: string) => void = () => {};
		const read = queryClient.current
			.fetchQuery({
				queryKey: checkInsKey,
				queryFn: () =>
					new Promise<string>((resolve) => (resolveRead = resolve)),
			})
			.catch(() => undefined);

		switchToMemberB();
		resolveRead("a's check-ins");
		await read;

		expect(queryClient.current.getQueryData(checkInsKey)).toBeUndefined();
	});

	it("is cleared by the next member's sign-in even if it landed while signed out", () => {
		claimMemberCache(null);
		queryClient.current.setQueryData(bandKey, "a's band");

		claimMemberCache("member-b");

		expect(queryClient.current.getQueryData(bandKey)).toBeUndefined();
	});
});

describe("a camera file", () => {
	// Saved captures are remembered for the whole run, so each test takes its own file.
	let captureUri = "";
	let captures = 0;

	beforeEach(() => {
		captureUri = `file://cache/ImagePicker/capture-${++captures}.jpg`;
		files.add(captureUri);
		capture(captureUri);
	});

	it("is deleted once its check-in is saved", async () => {
		transport.mockResolvedValue({
			id: "check-in",
			takenAt: new Date().toISOString(),
		});

		await expect(render().takeCheckIn()).resolves.toBe(true);
		expect(files.has(captureUri)).toBe(false);
	});

	it("is deleted when the check-in fails to save", async () => {
		await expect(render().takeCheckIn()).resolves.toBe(false);

		expect(render().error).toBe("Network request failed");
		expect(files.has(captureUri)).toBe(false);
	});

	it("is deleted when the photo is rejected before upload", async () => {
		vi.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({
			canceled: false,
			assets: [{ uri: captureUri, base64: "AAAA", mimeType: "image/gif" }],
		} as ImagePicker.ImagePickerResult);

		await expect(render().takeCheckIn()).resolves.toBe(false);
		expect(transport).not.toHaveBeenCalled();
		expect(files.has(captureUri)).toBe(false);
	});

	it("and any other camera file are deleted when the member signs out", async () => {
		const unclaimed = "file://cache/ImagePicker/never-returned.jpg";
		const elsewhere = "file://cache/other/kept.jpg";
		files.add(unclaimed);
		files.add(elsewhere);

		await forgetMemberData();

		expect([...files]).toEqual([elsewhere]);
	});
});
