import { Button } from "@seenmark/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@seenmark/ui/components/dropdown-menu";
import { Skeleton } from "@seenmark/ui/components/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton aria-label="Loading account" className="h-10 w-20 rounded-xl" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sign in
      </Link>
    );
  }

  const initial = session.user.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open account menu"
        render={<Button variant="ghost" className="h-10 gap-2 px-2.5" />}
      >
        <span className="grid size-7 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          {initial}
        </span>
        <span className="hidden max-w-28 truncate text-sm sm:inline">{session.user.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-xl bg-card p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 font-normal">
            <span className="block truncate text-sm font-medium text-foreground">
              {session.user.name}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer rounded-lg px-3 py-2"
          >
            Your check-ins
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => router.push("/"),
                },
              });
            }}
            className="cursor-pointer rounded-lg px-3 py-2"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
