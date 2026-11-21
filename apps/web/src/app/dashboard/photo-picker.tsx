import { buttonVariants } from "@seenmark/ui/components/button";
import { Spinner } from "@seenmark/ui/components/spinner";
import { Camera } from "lucide-react";

export default function PhotoPicker({
  disabled,
  saving = disabled,
  label,
  onFile,
}: {
  disabled: boolean;
  /** A photo is being saved. Disabled alone can mean another save is in flight. */
  saving?: boolean;
  label: string;
  onFile: (file: File) => void;
}) {
  return (
    <label
      aria-disabled={disabled || undefined}
      className={buttonVariants({
        className: `cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`,
      })}
    >
      {saving ? <Spinner /> : <Camera aria-hidden="true" />}
      {label}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled}
        aria-busy={saving || undefined}
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          input.value = "";
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
