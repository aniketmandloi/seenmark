"use client";

import { Input } from "@seenmark/ui/components/input";
import { Toggle } from "@seenmark/ui/components/toggle";
import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useState } from "react";

export default function PasswordInput(props: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-12" />
      <Toggle
        aria-label="Show password"
        aria-controls={props.id}
        pressed={visible}
        onPressedChange={(pressed) => setVisible(pressed)}
        className="absolute top-1 right-1 px-0"
      >
        {visible ? <EyeOff className="animate-pop" /> : <Eye className="animate-pop" />}
      </Toggle>
    </div>
  );
}
