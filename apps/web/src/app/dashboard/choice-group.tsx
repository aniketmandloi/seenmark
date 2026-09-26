"use client";

import { ToggleGroup, ToggleGroupItem } from "@seenmark/ui/components/toggle-group";

/**
 * A single-choice toggle group that reads as a radio group. Base UI toggles announce
 * aria-pressed, so each item is re-labelled as a radio, and pressing the chosen item again keeps
 * it chosen. Arrow keys move focus and Space or Enter chooses (the toolbar radio pattern), so
 * moving through the options never commits the ones passed on the way.
 */
export default function ChoiceGroup<T extends string>({
  options,
  value,
  onChoose,
  disabled,
  className,
  itemClassName,
  ...labelling
}: {
  options: readonly { value: T; label: string }[];
  value: T | null | undefined;
  onChoose: (value: T) => void;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  return (
    <ToggleGroup
      role="radiogroup"
      variant="outline"
      value={value ? [value] : []}
      disabled={disabled}
      className={className}
      onValueChange={(next) => {
        const chosen = options.find((option) => option.value === next[0]);
        if (chosen && chosen.value !== value) onChoose(chosen.value);
      }}
      {...labelling}
    >
      {options.map((option) => {
        const radio = {
          role: "radio",
          "aria-checked": option.value === value,
          "aria-pressed": undefined,
        };
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={itemClassName}
            {...radio}
          >
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
