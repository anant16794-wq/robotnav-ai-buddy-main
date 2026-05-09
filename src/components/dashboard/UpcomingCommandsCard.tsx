import { ArrowUp, ArrowLeft, ArrowRight, Octagon, ListOrdered, Clock, Route } from "lucide-react";
import type { RouteStep } from "@/lib/commands";
import { cn } from "@/lib/utils";
import { formatCompactDistance } from "@/utils/formatters";

const ICONS = {
  F: ArrowUp,
  L: ArrowLeft,
  R: ArrowRight,
  S: Octagon,
} as const;

interface UpcomingCommandsCardProps {
  steps: RouteStep[];
  totalDistance: number;
  etaMinutes: number;
  activeId?: number;
}

export function UpcomingCommandsCard({ steps, totalDistance, etaMinutes, activeId = 1 }: UpcomingCommandsCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <ListOrdered className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Route Commands</h2>
      </div>

      <ol className="flex flex-col gap-2">
        {steps.length === 0 && (
          <li className="rounded-xl border border-border/50 bg-background/40 px-3 py-4 text-center text-xs text-muted-foreground">
            Calculate a destination route to see live movement commands.
          </li>
        )}
        {steps.map((s) => {
          const Icon = ICONS[s.command];
          const isActive = s.id === activeId;
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                isActive
                  ? "border-secondary/60 bg-secondary/10 shadow-[0_0_18px_hsl(var(--secondary)/0.3)]"
                  : "border-border/50 bg-background/40",
              )}
            >
              <span className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold",
                isActive ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
              )}>
                {s.id}
              </span>
              <Icon className={cn("h-4 w-4", isActive ? "text-secondary" : "text-muted-foreground")} />
              <span className={cn("flex-1 text-sm font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {s.distance > 0 ? formatCompactDistance(s.distance) : "--"}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-xs">
        <div className="flex items-center gap-1.5">
          <Route className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">Total</span>
          <span className="ml-auto font-mono font-semibold text-foreground">{formatCompactDistance(totalDistance)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-accent" />
          <span className="text-muted-foreground">ETA</span>
          <span className="ml-auto font-mono font-semibold text-foreground">{etaMinutes > 0 ? `~${etaMinutes} min` : "--"}</span>
        </div>
      </div>
    </div>
  );
}
