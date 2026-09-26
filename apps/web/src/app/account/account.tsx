"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@seenmark/ui/components/alert-dialog";
import { Button } from "@seenmark/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader } from "@seenmark/ui/components/card";
import { Separator } from "@seenmark/ui/components/separator";
import { Spinner } from "@seenmark/ui/components/spinner";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import PageHeader from "@/components/page-header";
import { authClient } from "@/lib/auth-client";
import { forgetMemberData } from "@/lib/member-session";
import { signOut } from "@/lib/sign-out";
import { claimMemberCache, queryClient, trpc } from "@/utils/trpc";

export default function Account({ session }: { session: typeof authClient.$Infer.Session }) {
  claimMemberCache(session.user.id);
  const router = useRouter();
  const deleteAccount = useMutation(trpc.member.deleteAccount.mutationOptions());

  async function handleDeleteAccount() {
    try {
      await deleteAccount.mutateAsync();
      await authClient.signOut().catch(() => undefined);
      await forgetMemberData(queryClient);
      toast.success("Your account is deleted");
      router.replace("/");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "We could not delete your account.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-16 sm:px-8 md:pt-14">
      <PageHeader title="Account" lede="Your details, and what happens to your check-ins." />

      <section aria-labelledby="details-heading" className="mt-10">
        <Card>
          <CardHeader>
            <h2 id="details-heading" className="font-display text-heading">
              Your details
            </h2>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs">Name</dt>
                <dd className="mt-1 break-words font-medium text-base">{session.user.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Email</dt>
                <dd className="mt-1 break-all font-medium text-base">{session.user.email}</dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={async () => {
                if (await signOut()) router.push("/");
              }}
            >
              Sign out
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section aria-labelledby="privacy-heading" className="mt-12">
        <h2 id="privacy-heading" className="font-display text-heading">
          Your privacy
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground text-sm leading-6">
          <li>Only you can see your check-ins.</li>
          <li>Nothing is sent to a clinic, including an introduction request.</li>
          <li>
            Deleting a check-in removes its photo. Deleting your account removes every check-in
            photo.
          </li>
        </ul>
      </section>

      <Separator className="my-12" />

      <section
        aria-labelledby="danger-heading"
        className="rounded-3xl border border-destructive/30 p-6 sm:p-8"
      >
        <h2 id="danger-heading" className="font-display text-heading">
          Danger zone
        </h2>
        <p className="mt-2 max-w-md text-muted-foreground text-sm leading-6">
          Delete your account and every check-in photo. This cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" className="mt-5" />}>
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account and every check-in photo?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. You will be signed out.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my account</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleteAccount.isPending}
                aria-busy={deleteAccount.isPending || undefined}
                onClick={handleDeleteAccount}
              >
                {deleteAccount.isPending ? <Spinner data-icon="inline-start" /> : null}
                {deleteAccount.isPending ? "Deleting…" : "Delete account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
