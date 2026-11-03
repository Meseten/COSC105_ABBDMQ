"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password input with a peek button. Props mirror a plain input, so it
 * drops in wherever a password field already sits.
 */
export default function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  placeholder,
  minLength,
  required,
  className,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block min-w-0 flex-1">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        className={className ?? "h-11 w-full px-3 pr-10 text-base font-normal"}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        title={show ? "Hide password" : "Show password"}
        className="absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-sm text-mute transition-colors hover:text-herb"
      >
        {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </span>
  );
}
