export type Band = "early" | "mid" | "late";

export const bands: { value: Band; label: string }[] = [
  { value: "early", label: "Early" },
  { value: "mid", label: "Mid" },
  { value: "late", label: "Late" },
];
