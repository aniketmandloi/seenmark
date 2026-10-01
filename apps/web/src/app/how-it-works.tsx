"use client";

import { Camera, CircleCheck, type LucideIcon, Signpost } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Step = {
  title: string;
  description: string;
  icon: LucideIcon;
  /** The panel's own surface and the text color that reads on it. */
  surface: string;
  photo?: boolean;
};

const steps: Step[] = [
  {
    title: "Take a check-in",
    description: "Photograph your own hairline in similar light. Your photo stays yours.",
    icon: Camera,
    surface: "bg-zinc-900 text-zinc-50",
    photo: true,
  },
  {
    title: "Choose your band",
    description:
      "Look at your check-ins, then choose early, mid, or late. Seenmark never chooses for you.",
    icon: CircleCheck,
    surface: "bg-primary text-primary-foreground",
  },
  {
    title: "Explore a next step",
    description: "Read a short menu for your band. An introduction is always your request.",
    icon: Signpost,
    surface: "bg-card text-card-foreground ring-1 ring-border",
  },
];

/** One panel is open at a time. A mouse opens a panel by hovering it; touch and keys open it by pressing it. */
export default function HowItWorks() {
  const [open, setOpen] = useState(0);

  return (
    <ul className="flex h-[680px] flex-col gap-3 md:h-[520px] md:flex-row">
      {steps.map((step, index) => {
        const isOpen = index === open;
        const Icon = step.icon;
        return (
          <li
            key={step.title}
            className={`relative min-h-0 min-w-0 basis-0 overflow-hidden rounded-2xl transition-[flex-grow] duration-500 ease-out-soft ${
              isOpen ? "grow-3 md:grow-5" : "grow"
            } ${step.surface}`}
          >
            <button
              type="button"
              aria-label={step.title}
              aria-expanded={isOpen}
              aria-describedby={isOpen ? `step-${index}` : undefined}
              onClick={() => setOpen(index)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") setOpen(index);
              }}
              className="absolute inset-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              {step.photo ? (
                <>
                  <Image
                    src="/seenmark-checkin-hero.png"
                    alt=""
                    fill
                    sizes="(min-width: 768px) 60vw, 100vw"
                    className="object-cover object-[70%_30%]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-zinc-950/85 via-zinc-950/25 to-zinc-950/10"
                  />
                </>
              ) : null}
              <span className="relative flex h-full flex-col justify-between p-5 md:p-6">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-card text-card-foreground">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="block">
                  <span
                    className={`block font-display font-semibold tracking-tight ${
                      isOpen ? "text-3xl md:text-4xl" : "text-lg leading-snug"
                    }`}
                  >
                    {step.title}
                  </span>
                  <span
                    id={`step-${index}`}
                    hidden={!isOpen}
                    className="mt-2 block max-w-[36ch] animate-rise text-base leading-snug opacity-90 md:text-lg"
                  >
                    {step.description}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
