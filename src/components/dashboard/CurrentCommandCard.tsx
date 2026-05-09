import { ArrowUp, ArrowLeft, ArrowRight, Octagon } from "lucide-react";
import type { CommandResult, RobotCommand } from "@/lib/commands";
import { cn } from "@/lib/utils";

const ICONS: Record<RobotCommand, React.ComponentType<{ className?: string }>> = {
  F: ArrowUp,
  L: ArrowLeft,
  R: ArrowRight,
  S: Octagon,
};

export function CurrentCommandCard({ command }: { command: CommandResult }) {
  const Icon = ICONS[command.command];
  const isStop = command.command === "S";

  return (
    <div className={cn(
      "glass-card p-5 transition-all",
      isStop ? "border-destructive/60 shadow-[0_0_28px_hsl(var(--destructive)/0.4)]"
             : "border-secondary/60 shadow-[0_0_28px_hsl(var(--secondary)/0.35)]",
    )}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Current Command</h2>
        <span className={cn(
          "h-2 w-2 rounded-full animate-battery-pulse",
          isStop ? "bg-destructive shadow-[0_0_10px_hsl(var(--destructive))]"
                 : "bg-secondary shadow-[0_0_10px_hsl(var(--secondary))]",
        )} />
      </div>

      <div className="flex items-center gap-4">
        <div className={cn(
          "grid h-20 w-20 shrink-0 place-items-center rounded-2xl",
          isStop ? "bg-destructive/15 text-destructive" : "bg-secondary/15 text-secondary",
        )}>
          <Icon className="h-12 w-12" />
        </div>
        <div>
          <div className={cn(
            "font-mono text-2xl font-bold tracking-wider",
            isStop ? "text-destructive text-glow-destructive" : "text-secondary text-glow-secondary",
          )}>
            {command.label}
          </div>
          <div className="text-xs text-muted-foreground">{command.subtitle}</div>
        </div>
      </div>
    </div>
  );
}
