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
    title: "Read a next step",
    description: "Read a short menu for your band. An introduction is always your request.",
  },
];

/** The one real sequence on the page, so its steps are numbered and always visible. */
export default function HowItWorks() {
  return (
    <ol className="grid gap-x-10 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="border-foreground border-t-2 pt-5 pb-10 md:pb-0">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full border-2 border-foreground font-semibold tabular-nums"
          >
            {index + 1}
          </span>
          <h3 className="mt-6 font-semibold text-2xl leading-tight tracking-tight">{step.title}</h3>
          <p className="mt-3 max-w-[36ch] text-lede text-muted-foreground">{step.description}</p>
        </li>
      ))}
    </ol>
  );
}
