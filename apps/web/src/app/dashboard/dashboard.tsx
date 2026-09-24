"use client";

import { HISTORY_PAGE_SIZE, nextHistoryCursor } from "@seenmark/api/history";
import { MAX_PHOTO_BASE64_LENGTH } from "@seenmark/api/photo";
import { Button } from "@seenmark/ui/components/button";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Camera, Check, Clock3, ImagePlus, LockKeyhole, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent } from "react";

import { authClient } from "@/lib/auth-client";
import { forgetMemberData } from "@/lib/member-session";
import { claimMemberCache, queryClient, trpc } from "@/utils/trpc";

type Band = "early" | "mid" | "late";
type CheckIn = {
  id: string;
  takenAt: string;
};

const bands: { value: Band; label: string }[] = [
  { value: "early", label: "Early" },
  { value: "mid", label: "Mid" },
  { value: "late", label: "Late" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function Photo({ item, alt }: { item: CheckIn; alt: string }) {
  // A recorded photo never changes, so once loaded it is never refetched.
  const photo = useQuery({
    ...trpc.checkIn.photo.queryOptions({ id: item.id }),
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (photo.isError && !photo.data) {
    return (
      <div className="grid aspect-[3/4] w-full place-items-center rounded-2xl bg-muted p-4 text-center">
        <div role="alert">
          <p className="text-sm text-muted-foreground">This photo could not load.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            disabled={photo.isFetching}
            onClick={() => photo.refetch()}
          >
            {photo.isFetching ? "Trying…" : "Try again"}
          </Button>
        </div>
      </div>
    );
  }

  if (!photo.data) {
    return (
      <div
        role="status"
        aria-label="Loading photo"
        className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted motion-reduce:animate-none"
      />
    );
  }

  return (
    <Image
      src={`data:${photo.data.mediaType};base64,${photo.data.imageBase64}`}
      alt={alt}
      width={900}
      height={1200}
      unoptimized
      className="aspect-[3/4] w-full rounded-2xl bg-muted object-cover"
    />
  );
}

// Long enough to compare hairlines, small enough to stay under the photo limit as JPEG.
const MAX_PHOTO_EDGE = 2048;

async function preparePhoto(file: File) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("We could not read that photo.");
  }

  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("We could not read that photo.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const imageBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  if (imageBase64.length > MAX_PHOTO_BASE64_LENGTH) {
    throw new Error("That photo is too large to keep. Try a smaller one.");
  }
  return { imageBase64, mediaType: "image/jpeg" as const };
}

async function invalidateMemberLoop() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: trpc.checkIn.list.pathKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.score.current.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.menu.current.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.checkIn.reminder.queryKey() }),
    queryClient.invalidateQueries({ queryKey: trpc.introduction.current.queryKey() }),
  ]);
}

export default function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  // Before any read below, so a previous member's cached reads are never shown.
  claimMemberCache(session.user.id);
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [confirmAccountDeletion, setConfirmAccountDeletion] = useState(false);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);

  const checkIns = useInfiniteQuery(
    trpc.checkIn.list.infiniteQueryOptions(
      { limit: HISTORY_PAGE_SIZE },
      { getNextPageParam: nextHistoryCursor },
    ),
  );
  const currentBand = useQuery(trpc.score.current.queryOptions());
  const reminder = useQuery(trpc.checkIn.reminder.queryOptions());
  const menu = useQuery(trpc.menu.current.queryOptions());
  const introduction = useQuery(trpc.introduction.current.queryOptions());
  const record = useMutation(
    trpc.checkIn.record.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeCheckIn = useMutation(
    trpc.checkIn.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const chooseBand = useMutation(
    trpc.score.choose.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const fileIntroduction = useMutation(
    trpc.introduction.file.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const removeIntroduction = useMutation(
    trpc.introduction.delete.mutationOptions({ onSuccess: invalidateMemberLoop }),
  );
  const deleteAccount = useMutation(trpc.member.deleteAccount.mutationOptions());

  const items: CheckIn[] = checkIns.data?.pages.flat() ?? [];
  const opened = openedId ? (items.find((item) => item.id === openedId) ?? null) : null;
  const selectedBand = bands.find((band) => band.value === currentBand.data)?.label;
  const currentMenu = menu.data?.menu ?? null;
  const paidLink = currentMenu && "paidLink" in currentMenu ? currentMenu.paidLink : undefined;
  const isBusy =
    isPreparingPhoto ||
    record.isPending ||
    removeCheckIn.isPending ||
    chooseBand.isPending ||
    fileIntroduction.isPending ||
    removeIntroduction.isPending ||
    deleteAccount.isPending;

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Choose an image file to add a check-in.");
      return;
    }

    setErrorMessage(null);
    setOpenedId(null);
    setIsPreparingPhoto(true);

    try {
      await record.mutateAsync({
        ...(await preparePhoto(file)),
        takenAt: new Date().toISOString(),
      });
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not save that check-in.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  async function handleDeleteCheckIn(id: string) {
    setErrorMessage(null);
    try {
      await removeCheckIn.mutateAsync({ id });
      if (openedId === id) {
        setOpenedId(null);
      }
      // Photos never go stale, so a deleted one stays readable until evicted; a read still
      // in flight is cancelled so it cannot put the photo back.
      const photoKey = trpc.checkIn.photo.queryKey({ id });
      await queryClient.cancelQueries({ queryKey: photoKey });
      queryClient.removeQueries({ queryKey: photoKey });
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not delete that check-in.");
    }
  }

  async function handleChooseBand(band: Band) {
    setErrorMessage(null);
    try {
      await chooseBand.mutateAsync(band);
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not save your choice.");
    }
  }

  async function handleIntroduction(action: "file" | "delete") {
    setErrorMessage(null);
    try {
      if (action === "file") {
        await fileIntroduction.mutateAsync();
      } else {
        await removeIntroduction.mutateAsync();
      }
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "We could not update your request.");
    }
  }

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
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 md:pt-14 lg:px-10">
      <header className="grid gap-7 border-b border-border/80 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm text-muted-foreground">A private place for your check-ins</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Your check-ins
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
            Welcome back, {session.user.name}. Take a photo when you want to look again.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-accent/55 px-4 py-3 text-sm">
          <LockKeyhole aria-hidden="true" className="size-4 shrink-0 text-primary" />
          <span>Only you can see your photos.</span>
        </div>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
        <section aria-labelledby="timeline-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="timeline-heading" className="text-2xl font-semibold tracking-[-0.04em]">
                Your photo record
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Similar light and angle can make it easier to compare later.
              </p>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {items.length}
              {checkIns.hasNextPage ? "+" : ""} {items.length === 1 ? "check-in" : "check-ins"}
            </span>
          </div>

          {errorMessage ? (
            <p role="alert" className="mt-5 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}

          {checkIns.isLoading ? (
            <div className="mt-6 grid grid-cols-2 gap-4" role="status" aria-label="Loading check-ins">
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />
            </div>
          ) : checkIns.isError ? (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Your check-ins are unavailable</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {checkIns.error.message || "Try again in a moment."}
              </p>
              <Button variant="outline" className="mt-5" onClick={() => checkIns.refetch()}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-[1.75rem] border border-dashed border-border bg-card/70 px-6 py-10 text-center sm:px-10 sm:py-14">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-primary">
                <Camera aria-hidden="true" className="size-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Start with one photo</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Take a clear photo of your own hairline. You can add another check-in whenever you want.
              </p>
              <PhotoPicker disabled={isBusy} onChange={handlePhotoSelected} label="Add your first check-in" />
            </div>
          ) : opened ? (
            <div className="mt-6 max-w-xl">
              <Button variant="ghost" className="mb-4 px-2" onClick={() => setOpenedId(null)}>
                Back to your photos
              </Button>
              <figure>
                <Photo item={opened} alt={`Your check-in from ${formatDate(opened.takenAt)}`} />
                <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(opened.takenAt)}</span>
                  <DeleteCheckIn
                    id={opened.id}
                    date={formatDate(opened.takenAt)}
                    disabled={isBusy}
                    onDelete={handleDeleteCheckIn}
                  />
                </figcaption>
              </figure>
            </div>
          ) : (
            <div className="mt-6">
              <PhotoPicker disabled={isBusy} onChange={handlePhotoSelected} label="Add a check-in photo" />

              {items.length >= 2 && items[0] && items[1] ? (
                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
                  {[items[0], items[1]].map((item, index) => (
                    <figure key={item.id} className="min-w-0">
                      <Photo
                        item={item}
                        alt={`${index === 0 ? "Latest" : "Earlier"} check-in photo from ${formatDate(item.takenAt)}`}
                      />
                      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{index === 0 ? "Latest" : "Earlier"}</span>
                        <time dateTime={item.takenAt} className="text-muted-foreground">
                          {formatDate(item.takenAt)}
                        </time>
                      </figcaption>
                      <DeleteCheckIn
                        id={item.id}
                        date={formatDate(item.takenAt)}
                        disabled={isBusy}
                        onDelete={handleDeleteCheckIn}
                      />
                    </figure>
                  ))}
                </div>
              ) : (
                <figure className="mt-5 max-w-md">
                  {items[0] ? (
                    <>
                      <Photo item={items[0]} alt={`Check-in photo from ${formatDate(items[0].takenAt)}`} />
                      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                        <time dateTime={items[0].takenAt}>{formatDate(items[0].takenAt)}</time>
                        <DeleteCheckIn
                          id={items[0].id}
                          date={formatDate(items[0].takenAt)}
                          disabled={isBusy}
                          onDelete={handleDeleteCheckIn}
                        />
                      </figcaption>
                    </>
                  ) : null}
                </figure>
              )}

              {items.length > 2 ? (
                <section aria-labelledby="earlier-heading" className="mt-9 border-t border-border/80 pt-6">
                  <h3 id="earlier-heading" className="text-lg font-semibold tracking-tight">
                    Earlier check-ins
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.slice(2).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`Open check-in from ${formatDate(item.takenAt)}`}
                        onClick={() => setOpenedId(item.id)}
                        className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-left text-sm text-muted-foreground transition hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <Camera aria-hidden="true" className="size-4 shrink-0 text-primary" />
                        <span className="truncate">{formatDate(item.takenAt)}</span>
                      </button>
                    ))}
                  </div>
                  {checkIns.hasNextPage ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      disabled={checkIns.isFetchingNextPage}
                      onClick={() => checkIns.fetchNextPage()}
                    >
                      {checkIns.isFetchingNextPage ? "Loading…" : "Show earlier check-ins"}
                    </Button>
                  ) : null}
                </section>
              ) : null}

              {reminder.data?.due ? (
                <p className="mt-8 flex items-center gap-2 rounded-xl bg-accent/50 px-4 py-3 text-sm leading-6">
                  <Clock3 aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  {reminder.data.invitation}
                </p>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <section aria-labelledby="band-heading" className="rounded-[1.75rem] bg-card p-6 ring-1 ring-border/80 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="band-heading" className="text-2xl font-semibold tracking-[-0.04em]">
                  Choose your band
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  This is your choice after looking at your own check-ins. It is not a diagnosis.
                </p>
              </div>
              {currentBand.data ? <Check aria-hidden="true" className="mt-1 size-5 text-primary" /> : null}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2" role="group" aria-label="Choose your band">
              {bands.map((band) => {
                const selected = currentBand.data === band.value;
                return (
                  <button
                    key={band.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={items.length === 0 || isBusy || currentBand.isLoading}
                    onClick={() => handleChooseBand(band.value)}
                    className={`min-h-12 rounded-xl border px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/60 hover:bg-accent/50"
                    }`}
                  >
                    {band.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              You can change your choice whenever you want.
            </p>
          </section>

          {currentBand.data ? (
            <section aria-labelledby="menu-heading" className="rounded-[1.75rem] border border-border/80 bg-card p-6 sm:p-8">
              <h2 id="menu-heading" className="text-2xl font-semibold tracking-[-0.04em]">
                Next steps for {selectedBand}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A short menu to read at your pace. These are not a treatment plan.
              </p>

              {menu.isLoading ? (
                <div className="mt-6 space-y-3" role="status" aria-label="Loading next steps">
                  <div className="h-4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                </div>
              ) : menu.isError ? (
                <div role="alert" className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                  <p>We could not load your next steps.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => menu.refetch()}>
                    Try again
                  </Button>
                </div>
              ) : currentMenu ? (
                <ol className="mt-6 space-y-4">
                  {currentMenu.steps.map((step) => (
                    <li key={step} className="flex gap-3 text-sm leading-6">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              {paidLink ? (
                <p className="mt-6 border-t border-border/70 pt-4 text-sm leading-6">
                  <span className="font-semibold">Paid link</span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <a
                    href={paidLink.destination}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Visit link <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </p>
              ) : null}
            </section>
          ) : null}

          {currentBand.data === "late" ? (
            <section aria-labelledby="introduction-heading" className="rounded-[1.75rem] bg-accent/55 p-6 sm:p-8">
              <h2 id="introduction-heading" className="text-xl font-semibold tracking-tight">
                Ask for an introduction
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your request is recorded for you. It is not sent to a clinic.
              </p>
              {introduction.isError ? (
                <div role="alert" className="mt-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
                  <p>We could not check your request status.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => introduction.refetch()}>
                    Try again
                  </Button>
                </div>
              ) : introduction.data ? (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium">Request recorded</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => handleIntroduction("delete")}
                  >
                    Remove request
                  </Button>
                </div>
              ) : (
                <Button
                  className="mt-5"
                  disabled={isBusy || introduction.isLoading}
                  onClick={() => handleIntroduction("file")}
                >
                  {fileIntroduction.isPending ? "Recording…" : "Record my request"}
                </Button>
              )}
            </section>
          ) : null}

          <section aria-labelledby="account-privacy-heading" className="border-t border-border/80 pt-7">
            <h2 id="account-privacy-heading" className="text-lg font-semibold tracking-tight">
              Account privacy
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              You can remove your account and all of its check-in photos at any time.
            </p>
            {accountError ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {accountError}
              </p>
            ) : null}
            {confirmAccountDeletion ? (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium">Delete your account and every check-in photo?</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">This cannot be undone.</p>
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
        </aside>
      </div>
    </div>
  );
}

function PhotoPicker({
  disabled,
  label,
  onChange,
}: {
  disabled: boolean;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label
        className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:brightness-105 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {disabled ? <ImagePlus aria-hidden="true" className="size-4" /> : <Camera aria-hidden="true" className="size-4" />}
        {label}
        <input
          id="checkin-photo"
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          disabled={disabled}
          onChange={onChange}
        />
      </label>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Choose a photo from your device. On mobile, you can take one now.
      </p>
    </div>
  );
}

function DeleteCheckIn({
  date,
  disabled,
  id,
  onDelete,
}: {
  date: string;
  disabled: boolean;
  id: string;
  onDelete: (id: string) => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmationId = `delete-checkin-${id}`;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isConfirming}
        aria-controls={confirmationId}
        onClick={() => setIsConfirming(!isConfirming)}
        className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
        Delete
      </button>
      {isConfirming ? (
        <div
          id={confirmationId}
          className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-border bg-card p-4 text-left shadow-xl"
        >
          <p className="text-sm font-medium">Delete the check-in from {date}?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            This also removes the photo from your record.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setIsConfirming(false)}
            >
              Keep it
            </button>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled}
              onClick={() => {
                setIsConfirming(false);
                onDelete(id);
              }}
            >
              Delete photo
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
