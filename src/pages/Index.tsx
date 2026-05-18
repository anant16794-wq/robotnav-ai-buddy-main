import { useMemo, type ComponentType } from "react";
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { VoiceCommandCard } from "@/components/dashboard/VoiceCommandCard";
import { NavigationMap } from "@/components/dashboard/NavigationMap";
import { AudioFeedbackCard } from "@/components/dashboard/AudioFeedbackCard";
import { Esp32SimulationCard } from "@/components/dashboard/Esp32SimulationCard";
import { DestinationCard } from "@/components/dashboard/DestinationCard";
import { CurrentCommandCard } from "@/components/dashboard/CurrentCommandCard";
import { UpcomingCommandsCard } from "@/components/dashboard/UpcomingCommandsCard";
import { FamilyMonitorPanel } from "@/components/dashboard/FamilyMonitorPanel";
import { useDashboardState } from "@/hooks/useDashboardState";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { commandMeta, type RobotCommand } from "@/lib/commands";
import { MapPin, Navigation, Radio, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistance, formatDuration } from "@/utils/formatters";

const Index = () => {

  const s = useDashboardState();
  const { speak } = useSpeechSynthesis();

  const ESP32_IP = "192.168.4.1";

  const instruction = useMemo(() => {

    if (!s.route.steps.length)
      return "Enter a destination to calculate a live route.";

    const next =
      s.route.steps.find((st) => st.command !== "F") ??
      s.route.steps[0];

    if (!next)
      return "Continue forward.";

    if (next.command === "L")
      return `In ${next.distance} meters, turn left.`;

    if (next.command === "R")
      return `In ${next.distance} meters, turn right.`;

    if (next.command === "S")
      return `Destination reached. Stopping.`;

    return `Continue straight for ${next.distance} meters.`;

  }, [s.route]);

  const handleEmergency = () => {

    s.triggerEmergencyStop();

    speak("Emergency stop activated. Robot is now halted.");

    toast.error("Emergency stop triggered", {
      description: "Robot halted immediately.",
    });

  };

  // =========================
  // ESP32 COMMAND FUNCTION
  // =========================

  const handleSendEsp32 = async (cmd: RobotCommand) => {

    try {

      await fetch(`http://${ESP32_IP}/?State=${cmd}`);

      console.log("ESP32 Command Sent:", cmd);

      toast.success(`Command Sent: ${cmd}`);

    } catch (error) {

      console.log("ESP32 Error:", error);

      toast.error("Failed to connect with ESP32");

    }

    const meta = commandMeta(cmd);

    s.applyCommand({
      command: cmd,
      label: meta.label,
      subtitle: meta.subtitle,
      reply: `Manual ${meta.label}.`,
    });

  };

  const routeStatusText = {
    idle: "No route selected",
    locating: "Checking current location",
    searching: "Searching places",
    routing: "Calculating route",
    ready: "Route ready",
    error: "Route needs attention",
  }[s.routeStatus];

  return (
    <div className="min-h-screen p-3 sm:p-4">

      <div className="mx-auto grid max-w-[1700px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px]">

        <LeftSidebar
          status={s.status}
          battery={s.battery}
          onEmergencyStop={handleEmergency}
        />

        <main className="flex flex-col gap-4 animate-fade-in">

          <header className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                RobotNav Assist
              </div>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Accessible Navigation Console
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Route planning, voice control, safety oversight, and ESP32 telemetry arranged for fast operator decisions.
              </p>
            </div>

            <div className="grid gap-2 text-xs sm:min-w-[260px]">

              <div className="flex items-center gap-2 rounded-xl border border-secondary/30 bg-secondary/10 px-3 py-2 font-semibold text-secondary">
                <ShieldCheck className="h-4 w-4" />
                Safety link active
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-muted-foreground">
                <Radio className="h-4 w-4 text-primary" />
                {routeStatusText}
              </div>

            </div>

          </header>

          <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">

            <div className="flex flex-col gap-4">

              <RouteOverview
                route={s.route}
                usedBrowserLocation={s.usedBrowserLocation}
              />

              <NavigationMap
                route={s.route}
                isLoading={s.routeLoading}
                error={s.routeError}
              />

            </div>

            <div className="flex flex-col gap-4">

              <UpcomingCommandsCard
                steps={s.route.steps}
                totalDistance={s.route.totalDistance}
                etaMinutes={s.route.etaMinutes}
              />

              <CurrentCommandCard
                command={s.currentCommand}
              />

            </div>

          </section>

          <VoiceCommandCard onCommand={s.applyCommand} />

          <AudioFeedbackCard instruction={instruction} />

          <Esp32SimulationCard
            logs={s.logs}
            lastCommand={s.currentCommand.command}
            onSendCommand={handleSendEsp32}
          />

        </main>

        <aside className="flex flex-col gap-4 animate-fade-in xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-y-auto scrollbar-thin xl:pr-1">

          <DestinationCard
            current={s.route.destinationLabel}
            isLoading={s.routeLoading}
            error={s.routeError}
            routeStatus={s.routeStatus}
            usedBrowserLocation={s.usedBrowserLocation}
            recentDestinations={s.recentDestinations}
            savedPlaces={s.savedPlaces}
            onSet={s.setDestination}
            onClear={s.clearRoute}
          />

          <FamilyMonitorPanel
            lastLocation={s.familyMonitor.lastLocation}
            status={s.familyMonitor.status}
            lastCommand={s.familyMonitor.lastCommand}

            onStop={handleEmergency}

            onReturn={() => {

              toast.info("Returning to origin");

              s.applyCommand({
                command: "F",
                label: "RETURN",
                subtitle: "Heading home",
                reply: "Returning to start.",
              });

            }}

            onChangeRoute={() => {

              const nextPlace = s.savedPlaces[0];

              void s.setDestination(nextPlace.label, nextPlace);

              toast.success("Route change requested");

            }}

          />

        </aside>

      </div>

    </div>
  );
};

export default Index;

function RouteOverview({
  route,
  usedBrowserLocation,
}: {
  route: ReturnType<typeof useDashboardState>["route"];
  usedBrowserLocation: boolean;
}) {

  return (

    <section className="glass-card grid gap-3 p-4 sm:grid-cols-3">

      <OverviewItem
        icon={Navigation}
        label="Route"
        value={route.totalDistance ? "Active guidance" : "Awaiting destination"}
      />

      <OverviewItem
        icon={MapPin}
        label="Distance"
        value={formatDistance(route.totalDistance)}
      />

      <OverviewItem
        icon={Radio}
        label="ETA"
        value={formatDuration(route.durationSeconds)}
        helper={
          usedBrowserLocation
            ? "Using browser location"
            : "Using saved origin"
        }
      />

    </section>

  );
}

function OverviewItem({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  helper?: string;
}) {

  return (

    <div className="rounded-xl border border-border/50 bg-background/35 p-3">

      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>

      <div className="mt-1 text-sm font-semibold text-foreground">
        {value}
      </div>

      {helper && (
        <div className="mt-1 text-[11px] text-muted-foreground">
          {helper}
        </div>
      )}

    </div>

  );
}
