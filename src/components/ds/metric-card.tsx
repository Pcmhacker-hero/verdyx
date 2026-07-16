import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  hint?: string;
  chart?: ReactNode;
  className?: string;
}

/**
 * MetricCard — dashboard KPI tile. Uses tabular numerals so
 * comparable metrics align visually across a grid.
 */
export function MetricCard({ label, value, delta, hint, chart, className }: MetricCardProps) {
  const trendClass =
    delta?.trend === "up"
      ? "text-success"
      : delta?.trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  const TrendIcon =
    delta?.trend === "up" ? ArrowUpRight : delta?.trend === "down" ? ArrowDownRight : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-xs transition-shadow duration-200 hover:shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full bg-surface-muted px-1.5 py-0.5 font-mono text-2xs font-medium tabular",
              trendClass,
            )}
          >
            {TrendIcon ? <TrendIcon className="size-3" /> : null}
            {delta.value}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="tabular text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </span>
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      {chart ? <div className="mt-4 h-16">{chart}</div> : null}
    </div>
  );
}
