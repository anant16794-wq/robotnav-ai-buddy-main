import { Volume2, Play, Pause } from "lucide-react";
import { Waveform } from "./Waveform";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface AudioFeedbackCardProps {
  instruction: string;
}

export function AudioFeedbackCard({ instruction }: AudioFeedbackCardProps) {
  const { speaking, speak, cancel } = useSpeechSynthesis();

  const toggle = () => {
    if (speaking) cancel(); else speak(instruction);
  };

  return (
    <section id="section-monitoring" className="glass-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Audio Feedback</h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={speaking ? "Pause" : "Play"}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-[0_0_24px_hsl(var(--accent)/0.5)] transition-transform hover:scale-105"
        >
          {speaking ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current pl-0.5" />}
        </button>
        <div className="flex-1">
          <div className="text-base font-semibold text-foreground">{instruction}</div>
          <Waveform active={speaking} bars={36} color="accent" className="mt-1 h-8" />
        </div>
      </div>
    </section>
  );
}
