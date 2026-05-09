import { useEffect, useMemo, useState } from "react";
import { Clock3, Loader2, LocateFixed, MapPin, Navigation, Search, ShieldCheck, Star, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchLocations } from "@/services/routing/routingService";
import type { LocationSuggestion, RouteStatus } from "@/services/routing/types";

interface DestinationCardProps {
  current: string;
  isLoading: boolean;
  error: string | null;
  routeStatus: RouteStatus;
  usedBrowserLocation: boolean;
  recentDestinations: LocationSuggestion[];
  savedPlaces: LocationSuggestion[];
  onSet: (label: string, selectedLocation?: LocationSuggestion) => Promise<boolean>;
  onClear: () => void;
}

export function DestinationCard({
  current,
  isLoading,
  error,
  routeStatus,
  usedBrowserLocation,
  recentDestinations,
  savedPlaces,
  onSet,
  onClear,
}: DestinationCardProps) {
  const [val, setVal] = useState(current === "No destination selected" ? "" : current);
  const [selected, setSelected] = useState<LocationSuggestion | undefined>();
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [touched, setTouched] = useState(false);

  const validationMessage = useMemo(() => {
    if (!touched || val.trim()) return null;
    return "Enter a destination to calculate a route.";
  }, [touched, val]);

  useEffect(() => {
    const query = val.trim();
    setSelected(undefined);
    setSuggestionError(null);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSuggesting(true);
      try {
        const results = await searchLocations(query, 5);
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
        setSuggestionError(err instanceof Error ? err.message : "Location suggestions are unavailable.");
      } finally {
        setIsSuggesting(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [val]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!val.trim()) return;
    const ok = await onSet(val.trim(), selected);
    if (ok) setSuggestions([]);
  };

  const chooseSuggestion = (item: LocationSuggestion) => {
    setSelected(item);
    setVal(item.label);
    setSuggestions([]);
    setTouched(false);
  };

  const routeStateLabel = {
    idle: "No route",
    locating: "Locating",
    searching: "Searching",
    routing: "Routing",
    ready: "Ready",
    error: "Needs attention",
  }[routeStatus];

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-destructive text-glow-destructive" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Route Planner</h2>
        </div>
        <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {routeStateLabel}
        </span>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={val}
          onBlur={() => setTouched(true)}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Search for a location"
          className="w-full rounded-xl border border-border/60 bg-background/60 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
        />
        {isSuggesting && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[500] overflow-hidden rounded-xl border border-border/70 bg-card shadow-[0_18px_42px_hsl(222_80%_2%/0.65)]">
            {suggestions.map((item) => (
              <LocationButton key={item.id} item={item} onClick={() => chooseSuggestion(item)} />
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          Uses browser location only while calculating a route. {usedBrowserLocation ? "Current location is active." : "If permission is denied, the saved origin is used."}
        </span>
      </div>

      {(validationMessage || error || suggestionError) && (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{validationMessage || error || suggestionError}</span>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground shadow-[0_0_16px_hsl(var(--primary)/0.4)] hover:bg-primary-glow"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculating
            </>
          ) : (
            <>
              <Navigation className="mr-2 h-4 w-4" />
              Calculate Route
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClear} className="border-border/70 bg-background/40 px-3">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <PlaceGroup title="Saved Places" icon="saved" places={savedPlaces} onChoose={chooseSuggestion} />
      <PlaceGroup title="Recent" icon="recent" places={recentDestinations} onChoose={chooseSuggestion} empty="No recent routes yet." />
    </form>
  );
}

function PlaceGroup({
  title,
  icon,
  places,
  empty,
  onChoose,
}: {
  title: string;
  icon: "saved" | "recent";
  places: LocationSuggestion[];
  empty?: string;
  onChoose: (item: LocationSuggestion) => void;
}) {
  const Icon = icon === "saved" ? Star : Clock3;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {title}
      </div>
      <div className="grid gap-2">
        {places.length === 0 && empty && (
          <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-xs text-muted-foreground">{empty}</div>
        )}
        {places.map((item) => (
          <LocationButton key={item.id} item={item} onClick={() => onChoose(item)} compact />
        ))}
      </div>
    </div>
  );
}

function LocationButton({ item, compact, onClick }: { item: LocationSuggestion; compact?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex w-full items-start gap-2 rounded-xl border border-border/40 bg-background/30 px-3 py-2 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
    >
      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span className={compact ? "line-clamp-1" : "line-clamp-2"}>{item.label}</span>
    </button>
  );
}
