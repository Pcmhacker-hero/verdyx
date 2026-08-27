import { useNavigate } from "@tanstack/react-router";
import { useIsAdmin } from "@/hooks/use-is-admin";
import {
  BookOpen,
  Bug,
  Compass,
  Gauge,
  
  Keyboard,
  Layers,
  LogIn,
  Network,
  Radar,
  Medal,
  Rocket,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  UserCircle2,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu({
  open,
  onOpenChange,
  onOpenShortcuts,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onOpenShortcuts?: () => void;
}) {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const isDev = import.meta.env.DEV;
  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark overflow-hidden border-white/10 bg-neutral-950 p-0 text-neutral-100 shadow-2xl sm:max-w-xl">
        <DialogTitle className="sr-only">Command menu</DialogTitle>
        <Command>
          <CommandInput placeholder="Ask Verdiqy or jump to…" />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <p className="text-sm">No matches.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a page name, a rating, or a topic.
                </p>
              </div>
            </CommandEmpty>

            <CommandGroup heading="Quick actions">
              <CommandItem onSelect={() => go("/mentor")} keywords={["ai", "assistant", "atlas", "chat"]}>
                <Wand2 className="size-4 text-primary" />
                Ask Verdiqy anything…
                <CommandShortcut>G A</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/problems")} keywords={["focus", "start", "practice"]}>
                <Zap className="size-4 text-primary" />
                Start a practice session
                <CommandShortcut>⏎</CommandShortcut>
              </CommandItem>
              <CommandItem
                onSelect={() => go("/simulator")}
                keywords={["contest", "simulate", "practice"]}
              >
                <Timer className="size-4 text-primary" />
                Simulate a contest
              </CommandItem>
              <CommandItem onSelect={() => go("/mentor")} keywords={["ai", "help"]}>
                <Sparkles className="size-4 text-primary" />
                Ask the AI mentor
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Practice">
              <CommandItem onSelect={() => go("/problems")}>
                <Compass className="size-4" /> Problems
                <CommandShortcut>G P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/recommendations")}>
                <Radar className="size-4" /> Recommendations
                <CommandShortcut>G R</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/simulator")}>
                <Timer className="size-4" /> Contest Simulator
                <CommandShortcut>G V</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/contests")}>
                <Trophy className="size-4" /> Contests
                <CommandShortcut>G O</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Analyze">
              <CommandItem onSelect={() => go("/mistakes")}>
                <Bug className="size-4" /> Mistake Analyzer
                <CommandShortcut>G X</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/cheatsheets")}>
                <BookOpen className="size-4" /> Cheat Sheets
                <CommandShortcut>G H</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/compare")}>
                <Swords className="size-4" /> Compare
                <CommandShortcut>G C</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="You">
              <CommandItem onSelect={() => go("/mentor")}>
                <Wand2 className="size-4" /> Ask Verdiqy
                <CommandShortcut>G A</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/mentor")}>
                <Sparkles className="size-4" /> Mentor
                <CommandShortcut>G M</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/community")}>
                <Users className="size-4" /> Community
                <CommandShortcut>G Y</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/achievements")}>
                <Medal className="size-4" /> Achievements
                <CommandShortcut>G B</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => go("/profile")}>
                <UserCircle2 className="size-4" /> Profile
                <CommandShortcut>G U</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="System">
              {isAdmin ? (
                <CommandItem onSelect={() => go("/admin")}>
                  <Gauge className="size-4" /> Admin dashboard
                  <CommandShortcut>G D</CommandShortcut>
                </CommandItem>
              ) : null}
              {isAdmin || isDev ? (
                <CommandItem onSelect={() => go("/design-system")}>
                  <Layers className="size-4" /> Design system
                </CommandItem>
              ) : null}
              <CommandItem onSelect={() => go("/auth")}>
                <LogIn className="size-4" /> Sign in
              </CommandItem>
              {onOpenShortcuts ? (
                <CommandItem onSelect={onOpenShortcuts} keywords={["help", "keys"]}>
                  <Keyboard className="size-4" /> Keyboard shortcuts
                  <CommandShortcut>?</CommandShortcut>
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
