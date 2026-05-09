import { Users, MapPin, Octagon, RotateCcw, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FamilyMonitorPanelProps {
  lastLocation: string;
  status: string;
  lastCommand: string;
  onStop: () => void;
  onReturn: () => void;
  onChangeRoute: () => void;
}

export function FamilyMonitorPanel({
  lastLocation, status, lastCommand,
  onStop, onReturn, onChangeRoute,
}: FamilyMonitorPanelProps) {
  const isMoving = status === "MOVING";

  return (
    <div id="section-monitoring-family" className="glass-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Family Monitoring</h2>
      </div>

      <div className="space-y-2.5 rounded-xl border border-border/50 bg-background/40 p-3 text-xs">
        <Row label="Last Location" value={lastLocation} icon={<MapPin className="h-3.5 w-3.5 text-primary" />} />
        <Row
          label="Status"
          value={status}
          valueClass={isMoving ? "text-secondary text-glow-secondary" : "text-destructive text-glow-destructive"}
        />
        <Row label="Last Command" value={lastCommand} valueClass="text-primary text-glow-primary font-mono" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton onClick={onStop} label="STOP" Icon={Octagon}
          className="bg-destructive/15 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/40" />
        <ActionButton onClick={onReturn} label="RETURN" Icon={RotateCcw}
          className="bg-warning/15 text-warning hover:bg-warning hover:text-warning-foreground border-warning/40" />
        <ActionButton onClick={onChangeRoute} label="ROUTE" Icon={Shuffle}
          className="bg-primary/15 text-primary hover:bg-primary hover:text-primary-foreground border-primary/40" />
      </div>
    </div>
  );
}

function Row({ label, value, valueClass, icon }: {
  label: string; value: string; valueClass?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className={cn("truncate font-semibold", valueClass ?? "text-foreground")}>{value}</span>
    </div>
  );
}

function ActionButton({ onClick, label, Icon, className }: {
  onClick: () => void; label: string;
  Icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold tracking-wider transition-all",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
