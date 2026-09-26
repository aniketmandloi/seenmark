export default function FieldError({
  errors,
}: {
  errors: ReadonlyArray<{ message: string } | undefined>;
}) {
  return errors.map((error) => (
    <p key={error?.message} className="text-destructive text-sm">
      {error?.message}
    </p>
  ));
}
