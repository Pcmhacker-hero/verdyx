import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const dotVariants = cva("relative inline-flex shrink-0 rounded-full", {
  variants: {
    tone: {
      success: "bg-success",
      warning: "bg-warning",
      danger: "bg-destructive",
      info: "bg-info",
      neutral: "bg-muted-foreground/50",
      primary: "bg-primary",
    },
    size: {
      sm: "size-1.5",
      md: "size-2",
      lg: "size-2.5",
    },
    pulse: {
      true: "",
      false: "",
    },
  },
  defaultVariants: { tone: "success", size: "md", pulse: false },
});

interface StatusDotProps extends VariantProps<typeof dotVariants> {
  className?: string;
  label?: string;
}

/**
 * StatusDot — a small semantic indicator, optionally with pulse halo.
 */
export function StatusDot({ tone, size, pulse, className, label }: StatusDotProps) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <span className={cn(dotVariants({ tone, size }))}>
        {pulse ? (
          <span
            className={cn(
              "absolute inset-0 -z-10 rounded-full opacity-60 motion-safe:animate-ping",
              dotVariants({ tone }),
            )}
          />
        ) : null}
      </span>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </span>
  );
}
