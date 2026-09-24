/**
 * Admission for opening accounts, per client address. Better Auth limits its
 * own sign-up route in its HTTP router, which member.openAccount's direct
 * auth.api call skips, so this applies the same rule: 3 attempts per 10 seconds.
 */
export type SignUpLimit = {
	admit: (address: string) => boolean;
};

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10_000;
const PRUNE_AT = 10_000;

export function createSignUpLimit(now: () => number = Date.now): SignUpLimit {
	const windows = new Map<string, { start: number; count: number }>();

	return {
		admit(address) {
			const time = now();
			if (windows.size >= PRUNE_AT) {
				for (const [key, window] of windows) {
					if (time - window.start >= WINDOW_MS) windows.delete(key);
				}
			}

			const current = windows.get(address);
			if (!current || time - current.start >= WINDOW_MS) {
				windows.set(address, { start: time, count: 1 });
				return true;
			}
			if (current.count >= MAX_ATTEMPTS) {
				return false;
			}
			current.count += 1;
			return true;
		},
	};
}
