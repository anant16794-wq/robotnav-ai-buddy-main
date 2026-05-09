export type RobotCommand = "F" | "L" | "R" | "S";

export interface CommandResult {
  command: RobotCommand;
  label: string;
  subtitle: string;
  reply: string;
}

export interface RouteStep {
  id: number;
  command: RobotCommand;
  label: string;
  distance: number; // meters
}

const META: Record<RobotCommand, { label: string; subtitle: string }> = {
  F: { label: "FORWARD", subtitle: "Move Straight" },
  L: { label: "TURN LEFT", subtitle: "Rotate Left" },
  R: { label: "TURN RIGHT", subtitle: "Rotate Right" },
  S: { label: "STOP", subtitle: "Halt Movement" },
};

export function commandMeta(c: RobotCommand) {
  return META[c];
}

/** Local rule-based parser. Returns null if nothing matched. */
export function parseCommandLocal(text: string): CommandResult | null {
  const t = text.toLowerCase().trim();
  if (!t) return null;

  let command: RobotCommand | null = null;
  if (/\b(stop|halt|brake|freeze|emergency)\b/.test(t)) command = "S";
  else if (/\b(left)\b/.test(t)) command = "L";
  else if (/\b(right)\b/.test(t)) command = "R";
  else if (/\b(forward|straight|ahead|go|move|advance)\b/.test(t)) command = "F";

  if (!command) return null;
  const meta = META[command];
  return {
    command,
    label: meta.label,
    subtitle: meta.subtitle,
    reply: `Understood. Executing ${meta.label.toLowerCase()}.`,
  };
}
