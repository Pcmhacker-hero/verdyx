import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/**
 * Kbd — inline keyboard key.
 * Uses --font-mono, --text-2xs, --radius-sm, --border, --surface-muted.
 */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 select-none items-center justify-center rounded-sm border border-border bg-surface-muted px-1.5 font-mono text-2xs font-medium text-muted-foreground shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
