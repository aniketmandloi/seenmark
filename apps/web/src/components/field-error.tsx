type Errors = ReadonlyArray<{ message: string } | undefined>;

/**
 * Marks a control invalid and points it at the FieldError rendered for the same field, and at a
 * persistent hint when the field has one.
 */
export function fieldErrorProps(name: string, errors: Errors, hintId?: string) {
  const invalid = errors.length > 0;
  const describedBy = [invalid ? `${name}-error` : null, hintId].filter(Boolean).join(" ");
  return { "aria-invalid": invalid, "aria-describedby": describedBy || undefined };
}

/** Moves focus to the first invalid control once the errors from a failed submit have rendered. */
export function focusFirstInvalid(form: HTMLFormElement | null) {
  requestAnimationFrame(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
}

export default function FieldError({ name, errors }: { name: string; errors: Errors }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div
      id={`${name}-error`}
      role="alert"
      className="animate-rise space-y-1 text-destructive text-sm"
    >
      {errors.map((error) => (
        <p key={error?.message}>{error?.message}</p>
      ))}
    </div>
  );
}
