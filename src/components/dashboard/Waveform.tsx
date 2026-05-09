import { cn } from "@/lib/utils";

interface WaveformProps {
  active: boolean;
  bars?: number;
  className?: string;
  color?: "primary" | "secondary" | "accent";
}

export function Waveform({ active, bars = 28, className, color = "primary" }: WaveformProps) {
  const colorMap = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    accent: "bg-accent",
  } as const;
  return (
    <div className={cn("flex h-12 items-center justify-center gap-[3px]", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "block w-[3px] rounded-full origin-center",
            colorMap[color],
            active ? "animate-waveform" : "opacity-40",
          )}
          style={{
            height: `${20 + ((i * 37) % 60)}%`,
            animationDelay: `${(i % 8) * 0.08}s`,
            animationDuration: `${0.6 + ((i * 13) % 60) / 100}s`,
          }}
        />
      ))}
    </div>
  );
}
