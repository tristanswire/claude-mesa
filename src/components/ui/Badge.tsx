import { type HTMLAttributes, type ReactNode } from "react";

export type BadgeVariant = "default" | "primary" | "accent" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-foreground border-border",
  primary: "bg-primary-subtle text-primary border-primary/20",
  accent: "bg-accent-subtle text-accent border-accent/20", // Premium/special
  success: "bg-success-subtle text-success border-success/20",
  warning: "bg-warning-subtle text-warning border-warning/20",
  error: "bg-error-subtle text-error border-error/20",
  info: "bg-info-subtle text-info border-info/20",
};

export function Badge({
  variant = "default",
  children,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 text-xs font-medium
        rounded-full border
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}

// Chip variant - interactive, can be removed
type ChipSize = "sm" | "md";
type ChipVariant = BadgeVariant | "secondary";

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  onRemove?: () => void;
  children: ReactNode;
}

const chipSizeClasses: Record<ChipSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

const chipVariantClasses: Record<ChipVariant, string> = {
  ...variantClasses,
  secondary: "bg-surface text-muted border-border",
};

export function Chip({
  variant = "default",
  size = "md",
  onRemove,
  children,
  className = "",
  ...props
}: ChipProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium
        rounded-lg border
        ${chipSizeClasses[size]}
        ${chipVariantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 -mr-1 p-0.5 rounded-full hover:bg-foreground/10 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
