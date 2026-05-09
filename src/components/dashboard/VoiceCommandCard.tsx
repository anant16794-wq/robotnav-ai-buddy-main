import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, Sparkles, Bot } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Waveform } from "./Waveform";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { parseCommandLocal, type CommandResult } from "@/lib/commands";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface VoiceCommandCardProps {
  onCommand: (res: CommandResult) => void;
}

export function VoiceCommandCard({ onCommand }: VoiceCommandCardProps) {
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();
  const [useSmartParser, setUseSmartParser] = useState(false);
  const [manual, setManual] = useState("");
  const [reply, setReply] = useState("Awaiting voice command...");
  const [lastTranscript, setLastTranscript] = useState("");

  const displayed = transcript || lastTranscript || manual;

  const handleParse = useMemo(() => async (text: string) => {
    if (!text.trim()) return;
    setLastTranscript(text);
    if (useSmartParser) {
      toast.info("Smart parser preview", {
        description: "Using calibrated local movement rules until the production parser endpoint is connected.",
      });
    }
    const res = parseCommandLocal(text);
    if (!res) {
      setReply("Sorry, I didn't catch a movement command. Try: forward, left, right, or stop.");
      return;
    }
    setReply(res.reply);
    onCommand(res);
  }, [useSmartParser, onCommand]);

  useEffect(() => {
    if (!listening && transcript) {
      handleParse(transcript);
    }
  }, [listening, transcript, handleParse]);

  const toggleMic = () => {
    if (!supported) {
      toast.error("Speech recognition not supported in this browser. Use the text input below.");
      return;
    }
    if (listening) stop(); else start();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParse(manual);
    setManual("");
  };

  return (
    <section id="section-dashboard" className="glass-card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary text-glow-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Voice Command</h2>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="smart-parser-toggle" className="cursor-pointer text-xs text-muted-foreground">
              {useSmartParser ? "Smart parser" : "Local rules"}
            </Label>
            <Switch id="smart-parser-toggle" checked={useSmartParser} onCheckedChange={setUseSmartParser} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <button
            onClick={toggleMic}
            aria-label={listening ? "Stop listening" : "Start listening"}
            className={cn(
              "relative grid h-32 w-32 place-items-center rounded-full transition-all duration-300",
              "bg-gradient-to-br from-primary to-accent shadow-[0_0_40px_hsl(var(--primary)/0.5)]",
              "hover:scale-105 active:scale-95",
              listening && "animate-pulse-glow",
            )}
          >
            {listening && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-primary/60 animate-pulse-ring" />
                <span className="absolute inset-0 rounded-full border-2 border-primary/40 animate-pulse-ring [animation-delay:0.6s]" />
              </>
            )}
            {listening ? (
              <MicOff className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
            ) : (
              <Mic className="h-12 w-12 text-primary-foreground" strokeWidth={2.5} />
            )}
          </button>

          <p className="mt-4 text-sm font-semibold tracking-wide text-foreground">
            {listening ? "Listening..." : "Tap to Speak"}
          </p>

          <Waveform active={listening} className="mt-4 w-full max-w-md" />

          <div className="mt-4 grid w-full max-w-lg gap-3">
            <div className="rounded-xl border border-border/60 bg-background/40 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recognized</div>
              <div className="mt-1 min-h-[1.5rem] font-mono text-sm text-foreground">
                {displayed || <span className="text-muted-foreground/60">say a navigation command</span>}
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Bot className="h-3 w-3" /> System Reply
              </div>
              <div className="mt-1 text-sm text-foreground">{reply}</div>
            </div>
          </div>

          {!supported && (
            <form onSubmit={handleManualSubmit} className="mt-4 flex w-full max-w-lg gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder='Type "go forward" or "turn left"'
                className="flex-1 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                Send
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
