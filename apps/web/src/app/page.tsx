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

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-12 pb-20 sm:px-8 md:gap-14 md:pt-16 md:pb-28 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <div className="max-w-xl">
          <p className="mb-5 font-semibold text-primary text-sm tracking-[0.12em]">
            YOUR HAIRLINE, YOUR CALL
          </p>
          <h1 className="text-balance font-semibold text-5xl leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-[4.4rem]">
            Your hairline, over time.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg text-muted-foreground leading-8">
            Keep private check-in photos, compare them over time, and choose a next step that feels
            right to you.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground text-sm transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px"
            >
              Create your account
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 font-semibold text-foreground text-sm transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              How it works
            </Link>
          </div>
          <p className="mt-6 max-w-md text-muted-foreground text-sm leading-6">
            No diagnosis from a photo. No clinic directory. Just a private record and your own next
            step.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[44rem] lg:mx-0 lg:justify-self-end">
          <div className="overflow-hidden rounded-[2rem] bg-muted shadow-[0_28px_80px_-44px_rgba(31,65,49,0.48)] ring-1 ring-foreground/10">
            <Image
              src="/seenmark-checkin-hero.png"
              alt="An adult taking a private hairline check-in photo at home."
              width={1536}
              height={1024}
              priority
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="aspect-[1.13] h-full w-full object-cover object-[64%_center] sm:aspect-[1.35] lg:aspect-[1.1]"
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 border-border/70 border-y bg-card/60">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="mt-4 font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
              A little more perspective, over time.
            </h2>
          </div>

          <div className="mt-10 grid gap-0 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <p className="max-w-sm text-base text-muted-foreground leading-7">
              No complicated routine to keep up with. Come back when you want to take another look.
            </p>
            <ol className="mt-8 divide-y divide-border/80 lg:mt-0">
              {steps.map((step) => (
                <li key={step.title} className="grid gap-2 py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
                  <h3 className="font-semibold text-lg tracking-tight">{step.title}</h3>
                  <p className="max-w-xl text-muted-foreground text-sm leading-6">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-[0.8fr_1.2fr] md:items-center md:py-28 lg:px-10">
        <div>
          <h2 className="mt-4 max-w-lg font-semibold text-3xl tracking-[-0.04em] sm:text-4xl">
            Your photo is a record, not a diagnosis.
          </h2>
        </div>
        <div className="max-w-2xl border-primary/50 border-l-2 pl-6 sm:pl-8">
          <p className="text-lg text-muted-foreground leading-8">
            Seenmark stores your check-ins so you can look back. It does not analyze your photos or
            tell you which band to choose. Clinics cannot see your photos.
          </p>
        </div>
      </section>
    </div>
  );
}
