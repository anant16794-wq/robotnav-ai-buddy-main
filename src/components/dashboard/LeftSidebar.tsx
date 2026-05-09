import { useState } from "react";
import { LayoutDashboard, Map, Terminal, Activity, Settings, Bot, Battery, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RobotStatus } from "@/hooks/useDashboardState";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "navigation", label: "Navigation", icon: Map },
  { id: "commands", label: "Commands", icon: Terminal },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

interface LeftSidebarProps {
  status: RobotStatus;
  battery: number;
  onEmergencyStop: () => void;
}

export function LeftSidebar({ status, battery, onEmergencyStop }: LeftSidebarProps) {
  const [active, setActive] = useState<string>("dashboard");

  const handleNav = (id: string) => {
    setActive(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isMoving = status === "MOVING";

  return (
    <aside className="glass-card flex flex-col gap-6 p-5 lg:h-[calc(100vh-2rem)] lg:sticky lg:top-4">
      <div className="flex items-center gap-3">
        <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
          <Bot className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">RobotNav Assist</div>
          <div className="text-sm font-bold text-glow-primary">Mobility Console</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.4)]"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-glow-primary")} />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />}
            </button>
          );
        })}
      </nav>

      <Button
        onClick={onEmergencyStop}
        className="h-14 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 glow-destructive font-bold text-base tracking-wider animate-pulse-glow"
      >
        <Zap className="mr-2 h-5 w-5 fill-current" />
        EMERGENCY STOP
      </Button>

      <div className="mt-auto rounded-2xl border border-border/60 bg-card-elevated/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Robot Status</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider",
            isMoving
              ? "bg-secondary/20 text-secondary text-glow-secondary"
              : "bg-destructive/20 text-destructive text-glow-destructive",
          )}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "grid h-12 w-12 place-items-center rounded-xl border border-border/70 bg-background/60",
            isMoving && "border-secondary/60 shadow-[0_0_16px_hsl(var(--secondary)/0.4)]",
          )}>
            <Bot className={cn("h-6 w-6", isMoving ? "text-secondary" : "text-muted-foreground")} />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span className="flex items-center gap-1"><Battery className="h-3 w-3" /> BATTERY</span>
              <span className="font-mono text-foreground">{battery}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-secondary to-primary animate-battery-pulse"
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
