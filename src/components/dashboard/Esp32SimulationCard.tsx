import { useState } from "react";
import { Cpu, Send, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { commandMeta, type RobotCommand } from "@/lib/commands";
import type { Esp32LogEntry } from "@/hooks/useDashboardState";
import { cn } from "@/lib/utils";

interface Esp32SimulationCardProps {
  logs: Esp32LogEntry[];
  lastCommand: RobotCommand;
  onSendCommand: (cmd: RobotCommand) => void;
}

const CYCLE: RobotCommand[] = ["F", "L", "F", "R", "S"];

export function Esp32SimulationCard({ logs, lastCommand, onSendCommand }: Esp32SimulationCardProps) {
  const [idx, setIdx] = useState(0);

  const handleSend = () => {
    const next = CYCLE[idx % CYCLE.length];
    setIdx((i) => i + 1);
    onSendCommand(next);
  };

  return (
    <section id="section-commands" className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-secondary text-glow-secondary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            ESP32 Command Link
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-secondary">
          <span className="h-1.5 w-1.5 animate-battery-pulse rounded-full bg-secondary" /> CONNECTED
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-border/60 bg-background/50 p-4">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last Command</div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-5xl font-bold text-glow-primary text-primary">{lastCommand}</span>
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground">
              {commandMeta(lastCommand).label}
            </span>
          </div>
        </div>
        <Button
          onClick={handleSend}
          className="h-auto self-stretch bg-primary px-6 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:bg-primary-glow"
        >
          <Send className="mr-2 h-4 w-4" />
          Send Command
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-background/40">
        <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3 w-3" /> Communication Log
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">{logs.length} entries</span>
        </div>
        <ul className="scrollbar-thin max-h-44 overflow-y-auto p-2 text-xs">
          {logs.map((log) => (
            <li
              key={log.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-1.5 font-mono",
                log.command === "EMERGENCY" ? "text-destructive" : "text-foreground",
              )}
            >
              <span className="text-muted-foreground">{log.ts}</span>
              <span className="text-primary">&gt;</span>
              <span className="truncate">{log.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
