"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AuthInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  icon: LucideIcon;
  type?: "text" | "email" | "password" | "tel";
  error?: string;
  hint?: string;
};

export function AuthInput({
  label,
  icon: Icon,
  type = "text",
  error,
  hint,
  className = "",
  ...rest
}: AuthInputProps) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {hint && <span className="text-[10px] text-muted-foreground font-mono">{hint}</span>}
      </div>
      <div className="relative group">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <input
          type={inputType}
          className={`w-full bg-secondary/40 border ${
            error ? "border-destructive/60" : "border-border"
          } focus:border-primary rounded-lg py-2.5 pl-10 ${
            isPassword ? "pr-11" : "pr-4"
          } outline-none transition-all text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:bg-secondary/70 ${
            error ? "focus:border-destructive" : ""
          } ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
            tabIndex={-1}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-[11px] text-destructive flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-destructive shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}