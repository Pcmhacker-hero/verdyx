import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface TokenSwatchProps {
  name: string;
  value: string;
  className?: string;
  swatchClassName?: string;
  children?: ReactNode;
}

/**
 * TokenSwatch — displays a design token as a chip with a
 * live sample and its canonical variable name / value.
 */
export function TokenSwatch({
  name,
  value,
  className,
  swatchClassName,
  children,
}: TokenSwatchProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 transition-colors hover:bg-accent/40",
        className,
      )}
    >
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border/70",
          swatchClassName,
        )}
      >
        {children}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
        <p className="truncate font-mono text-2xs text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}
