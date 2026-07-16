import { cn } from "@/lib/utils";

/**
 * Animated Codeforces-colored "CF Solution" label used across video thumbnails.
 * Renders a shimmering gradient that enlarges and pulses when the parent
 * `.group` element is hovered OR receives keyboard focus (via
 * `group-focus-visible`). The badge itself is decorative (`aria-hidden`)
 * — focus lives on the surrounding interactive element (button/link),
 * which owns the tab order and focus ring.
 */
export function CFSolutionBadge({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-1 left-1 origin-bottom-left rounded bg-black/75 px-1 py-0.5 font-semibold uppercase tracking-[0.12em] text-[8px]",
        "bg-clip-text text-transparent [background-image:linear-gradient(90deg,#1F8ACB_0%,#4DA9E0_25%,#ffffff_50%,#4DA9E0_75%,#1F8ACB_100%)] [background-size:200%_100%] animate-shimmer",
        "transition-transform duration-300 ease-out",
        "group-hover:scale-125 group-hover:animate-pulse group-hover:drop-shadow-[0_0_6px_rgba(77,169,224,0.55)]",
        "group-focus-visible:scale-125 group-focus-visible:animate-pulse group-focus-visible:drop-shadow-[0_0_6px_rgba(77,169,224,0.55)]",
        "motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-visible:scale-100 motion-reduce:group-hover:animate-none motion-reduce:group-focus-visible:animate-none",
        className,
      )}
      style={{ WebkitBackgroundClip: "text", backgroundClip: "text" }}
    >
      CF Solution
    </span>
  );
}

