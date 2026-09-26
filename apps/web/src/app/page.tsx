import { buttonVariants } from "@seenmark/ui/components/button";
import { Card, CardContent } from "@seenmark/ui/components/card";
import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    title: "Take a check-in",
    description: "Photograph your own hairline in similar light. Your photo stays yours.",
  },
  {
    title: "Choose your band",
    description:
      "Look at your check-ins, then choose early, mid, or late. Seenmark never chooses for you.",
  },
  {
    title: "Explore a next step",
    description: "Read a short menu for your band. An introduction is always your request.",
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

const bands = [
  {
    name: "Early",
    focus: "Habits",
    description:
      "Everyday habits worth knowing: taking later photos in similar light, being gentle with heat and tension, and noticing shedding without keeping score.",
  },
  {
    name: "Mid",
    focus: "Who to talk to",
    description:
      "A prescriber is who discusses medicines. The mid menu says who that conversation is with, not what to take.",
  },
  {
    name: "Late",
    focus: "A clinic conversation",
    description:
      "What a clinic conversation is, and what verified means: a clinic Seenmark has checked for a named US-licensed physician, a published price range, and result photos at least 12 months out that aren't the clinic's ads. No clinic is verified yet, and there's no directory.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 md:gap-14 md:pt-16 md:pb-28 lg:grid-cols-2 lg:px-10">
        <div className="max-w-xl">
          <p className="mb-5 font-semibold text-primary text-sm uppercase tracking-widest">
            Your hairline, your call
          </p>
          <h1 className="text-balance font-display text-display">Your hairline, over time.</h1>
          <p className="mt-6 max-w-lg text-lede text-muted-foreground">
            Keep private check-in photos, compare them over time, and choose a next step that feels
            right to you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Get started
            </Link>
            <Link href="#how-it-works" className={buttonVariants({ variant: "ghost", size: "lg" })}>
              How it works
            </Link>
          </div>
          <p className="mt-6 max-w-md text-muted-foreground text-sm leading-6">
            Seenmark doesn't analyze your photos, and there's no clinic directory. Just a private
            record and your own next step.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:justify-self-end">
          <div className="overflow-hidden rounded-4xl bg-muted shadow-lifted ring-1 ring-foreground/10">
            <Image
              src="/seenmark-checkin-hero.png"
              alt="An adult taking a private hairline check-in photo at home."
              width={1536}
              height={1024}
              preload
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="aspect-4/3 h-full w-full object-cover sm:aspect-3/2 lg:aspect-4/3"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-border/70 border-y bg-card/60">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-20">
            <div>
              <h2 className="max-w-md font-display text-title">
                A little more perspective, over time.
              </h2>
              <p className="mt-6 max-w-sm text-muted-foreground">
                No complicated routine to keep up with. Come back when you want to take another
                look.
              </p>
            </div>
            <ol className="divide-y divide-border/80 lg:col-span-2">
              {steps.map((step, index) => (
                <li key={step.title} className="grid gap-2 py-6 sm:grid-cols-3 sm:gap-8">
                  <h3 className="flex items-baseline gap-3 font-display text-heading">
                    <span aria-hidden="true" className="text-primary tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {step.title}
                  </h3>
                  <p className="max-w-xl text-muted-foreground sm:col-span-2">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28 lg:px-10">
        <h2 className="max-w-lg font-display text-title">Private by design.</h2>
        <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {privacy.map((item) => (
            <li key={item.title} className="border-primary/50 border-l-2 pl-6">
              <h3 className="font-display text-heading">{item.title}</h3>
              <p className="mt-3 text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-border/70 border-y bg-card/60">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">
          <h2 className="max-w-lg font-display text-title">Three bands, three short menus.</h2>
          <p className="mt-6 max-w-2xl text-lede text-muted-foreground">
            A band is how you describe your own hair right now: early, mid, or late. You choose it
            after looking at your check-ins. Each band has a short menu to read, and every menu is
            educational. None tells you what to start or promises a result.
          </p>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {bands.map((band) => (
              <li key={band.name}>
                <Card className="h-full">
                  <CardContent>
                    <h3 className="font-display text-heading">{band.name}</h3>
                    <p className="mt-1 font-semibold text-primary">{band.focus}</p>
                    <p className="mt-4 text-muted-foreground">{band.description}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
