import { queryClient } from "@/utils/trpc";

/**
 * Member reads are private to the member who made them, and their query keys do not
 * name that member, so the cache is emptied (in-flight reads cancelled first) whenever
 * the member it belongs to may have changed.
 */
export async function forgetMemberData() {
	await queryClient.cancelQueries();
	queryClient.clear();
}

let cacheOwner: string | null = null;

/**
 * Called with the signed-in member (or null) before the member screens render. A session
 * can end without a sign-out, by expiring or being revoked, and another member can sign in,
 * so any change of member empties the cache before the new member's first read.
 */
export function claimMemberCache(memberId: string | null) {
	if (cacheOwner === memberId) return;
	cacheOwner = memberId;
	// Also on null to a member: a late reply may have written to the cache while signed out.
	void queryClient.cancelQueries();
	queryClient.clear();
}

