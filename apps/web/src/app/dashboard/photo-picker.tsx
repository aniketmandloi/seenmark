import { buttonVariants } from "@seenmark/ui/components/button";
import { Camera, ImagePlus } from "lucide-react";

export default function PhotoPicker({
  disabled,
  label,
  onFile,
}: {
  disabled: boolean;
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
      {disabled ? <ImagePlus aria-hidden="true" /> : <Camera aria-hidden="true" />}
      {label}
      <input
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        disabled={disabled}
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
