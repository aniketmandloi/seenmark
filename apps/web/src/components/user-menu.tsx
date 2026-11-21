import { Button, buttonVariants } from "@seenmark/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@seenmark/ui/components/dropdown-menu";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import { Spinner } from "@seenmark/ui/components/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { signOut } from "@/lib/sign-out";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <Skeleton role="status" aria-label="Loading account" className="h-11 w-20 rounded-xl" />;
  }

  if (!session) {
    return (
      <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
        Sign in
      </Link>
    );
  }

  const initial = session.user.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        // Starts with the visible name, so voice control users can say what they see.
        aria-label={`${session.user.name}, account menu`}
        render={<Button variant="ghost" className="h-10 gap-2 px-2.5" />}
      >
        <span className="grid size-7 place-items-center rounded-full bg-accent font-semibold text-accent-foreground text-xs">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-sm sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-xl bg-card p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 font-normal">
            <span className="block truncate font-medium text-foreground text-sm">
              {session.user.name}
            </span>
            <span className="mt-0.5 block truncate text-muted-foreground text-xs">
              {session.user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuLinkItem
            render={<Link href="/dashboard" />}
            className="cursor-pointer rounded-lg px-3 py-2"
          >
            Your check-ins
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem
            render={<Link href="/account" />}
            className="cursor-pointer rounded-lg px-3 py-2"
          >
            Account
          </DropdownMenuLinkItem>
          <DropdownMenuItem
            disabled={signingOut}
            closeOnClick={false}
            aria-busy={signingOut || undefined}
            onClick={async () => {
              setSigningOut(true);
              const signedOut = await signOut();
              setSigningOut(false);
              if (signedOut) router.push("/");
            }}
            className="cursor-pointer rounded-lg px-3 py-2"
          >
            {signingOut ? <Spinner /> : null}
            {signingOut ? "Signing out…" : "Sign out"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
