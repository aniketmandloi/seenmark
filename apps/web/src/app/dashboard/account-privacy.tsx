"use client";

import { Button } from "@seenmark/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { forgetMemberData } from "@/lib/member-session";
import { queryClient, trpc } from "@/utils/trpc";

export default function AccountPrivacy() {
  const router = useRouter();
  const [accountError, setAccountError] = useState<string | null>(null);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);
  const deleteAccount = useMutation(trpc.member.deleteAccount.mutationOptions());

  async function handleDeleteAccount() {
    setAccountError(null);
    try {
      await deleteAccount.mutateAsync();
      await authClient.signOut().catch(() => undefined);
      await forgetMemberData(queryClient);
      router.replace("/");
    } catch (cause) {
      setAccountError(cause instanceof Error ? cause.message : "We could not delete your account.");
    }
  }

  return (
    <section aria-labelledby="account-privacy-heading" className="border-border/80 border-t pt-7">
      <h2 id="account-privacy-heading" className="font-semibold text-lg tracking-tight">
        Account privacy
      </h2>
      <p className="mt-2 max-w-sm text-muted-foreground text-sm leading-6">
        You can remove your account and all of its check-in photos at any time.
      </p>
      {accountError ? (
        <p role="alert" className="mt-4 text-destructive text-sm">
          {accountError}
        </p>
      ) : null}
      {confirmAccountDeletion ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="font-medium text-sm">Delete your account and every check-in photo?</p>
          <p className="mt-1 text-muted-foreground text-xs leading-5">This cannot be undone.</p>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleteAccount.isPending}
              onClick={() => setConfirmAccountDeletion(false)}
            >
              Keep my account
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteAccount.isPending}
              onClick={handleDeleteAccount}
            >
              {deleteAccount.isPending ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setConfirmAccountDeletion(true)}
        >
          Delete account
        </Button>
      )}
    </section>
  );
}
