import { buttonVariants } from "@seenmark/ui/components/button";
import { cn } from "@seenmark/ui/lib/utils";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import BandSampler from "./band-sampler";
import HowItWorks from "./how-it-works";

type Note = {
  /** Where the note sits on extra-wide screens, as a share of the hero. */
  x: string;
  y: string;
  width: string;
  tilt: string;
} & (
  | { kind: "photo"; caption: string }
  | { kind: "note"; title: string; body: string }
  | { kind: "accent"; body: string }
);

const notes: Note[] = [
  {
    kind: "photo",
    caption: "A check-in, taken at home",
    x: "52%",
    y: "6%",
    width: "320px",
    tilt: "rotate-3",
  },
  {
    kind: "note",
    title: "Only you can see your photos.",
    body: "Seenmark keeps them so you can compare. It doesn't analyze them.",
    x: "76%",
    y: "11%",
    width: "270px",
    tilt: "-rotate-3",
  },
  {
    kind: "accent",
    body: "You choose early, mid, or late.",
    x: "83%",
    y: "50%",
    width: "200px",
    tilt: "rotate-4",
  },
  {
    kind: "note",
    title: "No clinic directory.",
    body: "An introduction to a clinic is only ever your request.",
    x: "56%",
    y: "60%",
    width: "255px",
    tilt: "-rotate-2",
  },
];

const privacy = [
  {
    title: "Only you can see your photos.",
    description:
      "Seenmark keeps your check-ins so you can look back and compare them. It doesn't analyze them.",
  },
  {
    title: "You choose your band.",
    description:
      "Look at your own check-ins, then choose early, mid, or late. Seenmark never chooses it for you, and nobody can pay to change it.",
  },
  {
    title: "Clinics cannot see your photos.",
    description:
      "Seenmark doesn't send your check-ins to a clinic. An introduction is only ever your request.",
  },
];

const faqs = [
  {
    question: "Does Seenmark diagnose my hair?",
    answer:
      "No. Seenmark keeps your check-ins and shows them back to you side by side. It doesn't analyze them. You look, and you choose your band.",
    card: "bg-primary text-primary-foreground -rotate-[1.4deg]",
  },
  {
    question: "Who can see my photos?",
    answer: "Only you. Your check-ins aren't shared with clinics or anyone else.",
    card: "bg-card ring-1 ring-border rotate-[1.2deg] md:mt-16",
  },
  {
    question: "What does it cost?",
    answer: "Nothing. Seenmark is free for members, with no subscription and no fees.",
    card: "bg-muted ring-1 ring-border rotate-[1.6deg]",
  },
  {
    question: "Can I delete everything?",
    answer:
      "Yes. Deleting a check-in removes its photo. Deleting your account removes it along with every photo you've kept.",
    card: "bg-card ring-1 ring-border -rotate-1 md:mt-16",
  },
];

const paper = "rounded-md bg-card shadow-paper ring-1 ring-border";

export default function Home() {
  return (
    <div>
      <section className="flex flex-col xl:relative xl:min-h-[calc(100dvh-4rem)]">
        <ul
          aria-label="What Seenmark promises"
          className="order-last grid grid-cols-2 gap-x-5 gap-y-7 px-5 pb-16 sm:px-8 md:grid-cols-3 xl:absolute xl:inset-0 xl:block xl:p-0"
        >
          {notes.map((note, index) => (
            <li
              key={note.kind === "photo" ? note.caption : note.body}
              style={
                { "--x": note.x, "--y": note.y, "--w": note.width, "--i": index } as CSSProperties
              }
              className={`w-full animate-drop transition-[rotate] duration-300 [animation-delay:calc(var(--i)*90ms+150ms)] hover:rotate-0 xl:absolute xl:top-(--y) xl:left-(--x) xl:w-(--w) ${note.tilt} ${
                note.kind === "photo" ? "col-span-2 md:col-span-1" : ""
              }`}
            >
              {note.kind === "photo" ? (
                <figure className={`${paper} p-2.5 pb-3`}>
                  <Image
                    src="/seenmark-checkin-hero.png"
                    alt="An adult taking a private hairline check-in photo at home."
                    width={1536}
                    height={1024}
                    preload
                    sizes="(min-width: 1280px) 320px, (min-width: 768px) 66vw, 100vw"
                    className="aspect-4/3 w-full rounded-sm object-cover"
                  />
                  <figcaption className="mt-2.5 text-[13px] text-muted-foreground">
                    {note.caption}
                  </figcaption>
                </figure>
              ) : note.kind === "note" ? (
                <div className={`${paper} p-4`}>
                  <p className="font-semibold tracking-tight">{note.title}</p>
                  <p className="mt-1.5 text-muted-foreground text-sm leading-snug">{note.body}</p>
                </div>
              ) : (
                <p className="rounded-md bg-primary p-5 font-semibold text-lg text-primary-foreground leading-snug tracking-tight shadow-paper">
                  {note.body}
                </p>
              )}
            </li>
          ))}
        </ul>

        <div className="relative mx-auto w-full max-w-7xl px-5 pt-10 pb-12 sm:px-8 lg:px-10 xl:pt-20 xl:pb-0">
          <div className="max-w-xl">
            <h1 className="animate-lift font-display text-display">
              <span className="block">Your hairline,</span>
              <span className="block">
                <span className="hl hl-sweep">over time</span>.
              </span>
            </h1>
            <p
              className="stagger mt-7 max-w-[42ch] animate-rise text-lede text-muted-foreground"
              style={{ "--i": 2 } as CSSProperties}
            >
              Keep private check-in photos, compare them over time, and choose a next step that
              feels right to you.
            </p>
            <div
              className="stagger mt-9 flex animate-rise flex-wrap items-center gap-3"
              style={{ "--i": 3 } as CSSProperties}
            >
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "group" })}>
                Get started
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
              <Link
                href="#how-it-works"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="reveal">
          <h2 className="max-w-[18ch] text-balance font-display text-title">
            A little more perspective, over time.
          </h2>
          <p className="mt-6 max-w-[44ch] text-lede text-muted-foreground">
            No complicated routine to keep up with. Come back when you want to take another look.
          </p>
        </div>
        <div className="mt-12">
          <HowItWorks />
        </div>
      </section>

      <section id="bands" className="bg-muted">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="reveal">
            <h2 className="max-w-[16ch] font-display text-title">
              Three bands, <span className="hl">three short menus.</span>
            </h2>
            <p className="mt-6 max-w-[48ch] text-lede text-muted-foreground">
              A band is how you describe your own hair right now. You choose it after looking at
              your check-ins. Try it here.
            </p>
          </div>
          <div className="mt-12">
            <BandSampler />
          </div>
        </div>
      </section>

      <section id="privacy" className="border-border border-b">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-12 lg:gap-10 lg:px-10 lg:py-32">
          <div className="lg:col-span-4">
            <h2 className="font-display text-title lg:sticky lg:top-28">Private by design.</h2>
          </div>
          <ul className="space-y-10 md:space-y-14 lg:col-span-8">
            {privacy.map((item) => (
              <li key={item.title} className="reveal flex items-start gap-4 md:gap-5">
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground md:mt-2.5 md:size-10">
                  <Check aria-hidden="true" className="size-4 md:size-5" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-balance font-display font-semibold text-3xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-[52ch] text-lede text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="questions" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <h2 className="reveal max-w-[16ch] font-display text-title">
          Questions, answered plainly.
        </h2>
        <ul className="mt-14 grid gap-8 md:grid-cols-2 md:gap-x-10">
          {faqs.map((faq) => (
            <li key={faq.question} className="reveal">
              <div
                className={`rounded-md p-7 shadow-paper transition-[rotate,translate] duration-300 hover:-translate-y-1 hover:rotate-0 md:p-9 ${faq.card}`}
              >
                <h3 className="text-balance font-display font-semibold text-2xl leading-snug tracking-tight">
                  {faq.question}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed opacity-80">{faq.answer}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pb-8 sm:px-8 lg:px-10">
        <div className="reveal mx-auto max-w-7xl rounded-2xl bg-primary p-8 text-primary-foreground md:p-16">
          <h2 className="max-w-[10ch] font-display font-semibold text-5xl leading-[0.98] tracking-[-0.04em] md:text-8xl">
            Start with one check-in.
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link
              href="/signup"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group bg-primary-foreground text-primary shadow-none hover:brightness-125 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary",
              )}
            >
              Get started
              <ArrowRight
                aria-hidden="true"
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
            <p className="max-w-[38ch] font-medium leading-snug">
              Take one photo today. Compare it with the next one whenever you're ready.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
