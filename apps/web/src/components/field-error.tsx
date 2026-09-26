type Errors = ReadonlyArray<{ message: string } | undefined>;

/** Marks a control invalid and points it at the FieldError rendered for the same field. */
export function fieldErrorProps(name: string, errors: Errors) {
  const invalid = errors.length > 0;
  return { "aria-invalid": invalid, "aria-describedby": invalid ? `${name}-error` : undefined };
}

export default function FieldError({ name, errors }: { name: string; errors: Errors }) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div id={`${name}-error`} role="alert" className="space-y-1 text-destructive text-sm">
      {errors.map((error) => (
        <p key={error?.message}>{error?.message}</p>
      ))}
    </div>
  );
}
