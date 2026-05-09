import { useCallback, useMemo, useState } from "react";
import { commandMeta, type CommandResult, type RobotCommand } from "@/lib/commands";
import {
  DEFAULT_ORIGIN,
  buildRouteToDestination,
  makeEmptyRoute,
  resolveCurrentOrigin,
} from "@/services/routing/routingService";
import type { LocationSuggestion, NavigationRoute, RoutePoint, RouteStatus } from "@/services/routing/types";

export type RobotStatus = "MOVING" | "STOPPED" | "IDLE";

export interface Esp32LogEntry {
  id: string;
  ts: string;
  command: RobotCommand | "EMERGENCY";
  text: string;
}

const SAVED_PLACES: LocationSuggestion[] = [
  { id: "saved-pharmacy", label: "Nearest Pharmacy, Strand, London", lat: 51.5117, lng: -0.1202 },
  { id: "saved-hospital", label: "St Thomas' Hospital, Westminster Bridge Road, London", lat: 51.4986, lng: -0.1188 },
  { id: "saved-home", label: "Home Base, Trafalgar Square, London", lat: 51.508, lng: -0.1281 },
];

export function useDashboardState() {
  const [status, setStatus] = useState<RobotStatus>("IDLE");
  const [battery] = useState(87);
  const [origin, setOrigin] = useState<RoutePoint>(DEFAULT_ORIGIN);
  const [route, setRoute] = useState<NavigationRoute>(() => makeEmptyRoute(DEFAULT_ORIGIN));
  const [routeStatus, setRouteStatus] = useState<RouteStatus>("idle");
  const [routeError, setRouteError] = useState<string | null>(null);
  const [usedBrowserLocation, setUsedBrowserLocation] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<LocationSuggestion[]>([]);
  const [currentCommand, setCurrentCommand] = useState<CommandResult>(() => {
    const meta = commandMeta("S");
    return { command: "S", label: meta.label, subtitle: "Awaiting Route", reply: "Enter a destination to begin navigation." };
  });
  const [logs, setLogs] = useState<Esp32LogEntry[]>([
    { id: "l1", ts: ts(), command: "S", text: "Navigation system ready" },
  ]);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("Awaiting voice command...");

  const routeLoading = routeStatus === "locating" || routeStatus === "routing";

  const addLog = useCallback((command: RobotCommand | "EMERGENCY", text: string) => {
    setLogs((prev) => [
      { id: crypto.randomUUID(), ts: ts(), command, text },
      ...prev,
    ].slice(0, 40));
  }, []);

  const applyCommand = useCallback((res: CommandResult) => {
    setCurrentCommand(res);
    setAiReply(res.reply);
    addLog(res.command, `Command Sent: ${res.command} (${res.label})`);
    setStatus(res.command === "S" ? "STOPPED" : "MOVING");
  }, [addLog]);

  const triggerEmergencyStop = useCallback(() => {
    setStatus("STOPPED");
    const meta = commandMeta("S");
    setCurrentCommand({ command: "S", label: meta.label, subtitle: "Emergency Halt", reply: "Emergency stop activated." });
    addLog("EMERGENCY", "EMERGENCY STOP triggered - robot halted");
  }, [addLog]);

  const setDestination = useCallback(async (label: string, selectedLocation?: LocationSuggestion) => {
    const destination = label.trim();
    if (!destination) {
      setRouteStatus("error");
      setRouteError("Enter a destination to calculate a route.");
      return false;
    }

    setRouteStatus("locating");
    setRouteError(null);
    try {
      const locationResult = await resolveCurrentOrigin(origin);
      setUsedBrowserLocation(locationResult.usedBrowserLocation);
      setOrigin(locationResult.origin);

      setRouteStatus("routing");
      const nextRoute = await buildRouteToDestination(destination, locationResult.origin, selectedLocation);
      setRoute(nextRoute);
      setRouteStatus("ready");
      setStatus("MOVING");
      setRecentDestinations((prev) => mergeRecentDestinations(prev, {
        id: selectedLocation?.id ?? `recent-${Date.now()}`,
        label: nextRoute.destinationLabel,
        lat: nextRoute.destination.lat,
        lng: nextRoute.destination.lng,
      }));

      const meta = commandMeta("F");
      setCurrentCommand({
        command: "F",
        label: meta.label,
        subtitle: "Route Active",
        reply: `Route calculated to ${nextRoute.destinationLabel}.`,
      });
      addLog("F", `Route calculated: ${nextRoute.totalDistance}m to ${nextRoute.destinationLabel}`);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to calculate a route.";
      setRouteStatus("error");
      setRouteError(message);
      addLog("S", `Route error: ${message}`);
      return false;
    }
  }, [addLog, origin]);

  const clearRoute = useCallback(() => {
    setRoute(makeEmptyRoute(origin));
    setRouteStatus("idle");
    setRouteError(null);
    setStatus("IDLE");
    const meta = commandMeta("S");
    setCurrentCommand({ command: "S", label: meta.label, subtitle: "Awaiting Route", reply: "Route cleared." });
    addLog("S", "Route cleared by operator");
  }, [addLog, origin]);

  const familyMonitor = useMemo(() => ({
    lastLocation: route.totalDistance > 0 ? route.originLabel : "Awaiting destination",
    status,
    lastCommand: currentCommand.label,
  }), [route.originLabel, route.totalDistance, status, currentCommand]);

  return {
    status, setStatus,
    battery,
    route, setDestination, clearRoute, routeLoading, routeError, routeStatus,
    recentDestinations, savedPlaces: SAVED_PLACES, usedBrowserLocation,
    currentCommand, applyCommand,
    logs, addLog,
    transcript, setTranscript,
    aiReply, setAiReply,
    triggerEmergencyStop,
    familyMonitor,
  };
}

function mergeRecentDestinations(prev: LocationSuggestion[], next: LocationSuggestion) {
  return [
    next,
    ...prev.filter((item) => item.label !== next.label),
  ].slice(0, 4);
}

function ts(offsetSec = 0) {
  const d = new Date(Date.now() + offsetSec * 1000);
  return d.toLocaleTimeString([], { hour12: false });
}
