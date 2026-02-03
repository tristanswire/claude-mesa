"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, id, disabled, checked, ...props }, ref) => {
    const checkboxElement = (
      <span className="relative inline-flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          id={id}
          disabled={disabled}
          checked={checked}
          className="peer sr-only"
          {...props}
        />
        <span
          className={`
            h-5 w-5 shrink-0 rounded border-2 transition-all
            border-border bg-surface
            peer-checked:border-primary peer-checked:bg-primary
            peer-hover:border-primary/60
            peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface
            peer-disabled:cursor-not-allowed peer-disabled:opacity-50
            ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            ${className}
          `}
        >
          <Check
            className={`
              h-3.5 w-3.5 text-primary-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              transition-opacity
              ${checked ? "opacity-100" : "opacity-0"}
            `}
            strokeWidth={3}
          />
        </span>
      </span>
    );

    if (label) {
      return (
        <label
          className={`inline-flex items-center gap-2 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        >
          {checkboxElement}
          <span className="text-sm text-foreground">{label}</span>
        </label>
      );
    }

    return checkboxElement;
  }
);

Checkbox.displayName = "Checkbox";
