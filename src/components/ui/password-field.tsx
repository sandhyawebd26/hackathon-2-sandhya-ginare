"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  name = "password",
  required = true,
  minLength,
  autoComplete = "current-password",
}: {
  name?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative mt-2">
      <input
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        className="w-full border-b border-border bg-transparent py-2 pr-12 text-base tracking-normal normal-case"
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
        className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-muted-foreground"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
