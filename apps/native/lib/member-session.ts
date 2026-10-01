import { discardAllCaptures } from "@/lib/captures";
import { queryClient } from "@/utils/trpc";

/**
 * Member reads are private to the member who made them, and their query keys do not
 * name that member, so the cache is emptied (in-flight reads cancelled first) whenever
 * the member it belongs to may have changed. Camera files the member left are deleted too.
 */
export async function forgetMemberData() {
	discardAllCaptures();
	await queryClient.cancelQueries();
	queryClient.clear();
}

let cacheOwner: string | null = null;
let session = 0;

/**
 * Called with the signed-in member (or null) before the member screens render. A session
 * can end without a sign-out, by expiring or being revoked, and another member can sign in,
 * so any change of member empties the cache before the new member's first read.
 */
export function claimMemberCache(memberId: string | null) {
	if (cacheOwner === memberId) return;
	cacheOwner = memberId;
	session += 1;
	// Also on null to a member: a late reply may have written to the cache while signed out.
	void queryClient.cancelQueries();
	queryClient.clear();
}

/**
 * Taken when a member's action starts. Clearing the cache does not stop a request already
 * sent, so its reply checks this before touching the cache or the screen, which may now
 * belong to another member.
 */
export function captureMemberSession() {
	const started = session;
	return () => started === session;
}
