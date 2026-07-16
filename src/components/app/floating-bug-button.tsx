import { useState } from "react";
import { Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { BugReportDialog } from "@/components/app/app-shell";

/**
 * Floating "Report a bug" FAB, fixed to the bottom-right corner globally.
 *
 * Pass `hiddenOnDesktop` (usually `!sidebarCollapsed`) to hide the button on
 * desktop when the app sidebar is expanded — the sidebar already exposes its
 * own "Report Bug" button so the FAB would double up. Mobile always shows it
 * because the mobile sidebar is off-canvas and not persistently visible.
 */
export function FloatingBugButton({
  hiddenOnDesktop = false,
  className,
}: {
  hiddenOnDesktop?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Report a bug"
        title="Report a bug"
        onClick={() => setOpen(true)}
        className={cn(
          "group fixed bottom-5 right-5 z-40 grid size-12 place-items-center rounded-full",
          "bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(56,132,255,0.55)]",
          "ring-1 ring-white/15 transition-all duration-200",
          "hover:scale-105 hover:shadow-[0_14px_36px_-8px_rgba(56,132,255,0.7)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-95",
          hiddenOnDesktop && "md:hidden",
          className,
        )}
      >
        <Bug className="size-5" strokeWidth={2.25} />
        <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25" />
      </button>
      <BugReportDialog open={open} onOpenChange={setOpen} source="fab" />
    </>
  );
}

