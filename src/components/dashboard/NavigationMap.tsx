import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AlertCircle, Crosshair, Loader2, MapPin, Minus, Navigation2, Plus, Route as RouteIcon, TimerReset } from "lucide-react";
import type { NavigationRoute } from "@/services/routing/types";
import { formatDistance, formatDuration } from "@/utils/formatters";

interface NavigationMapProps {
  route: NavigationRoute;
  isLoading?: boolean;
  error?: string | null;
}

export function NavigationMap({ route, isLoading = false, error }: NavigationMapProps) {
  const [LeafletMod, setLeafletMod] = useState<typeof import("leaflet") | null>(null);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const hasRoute = route.path.length > 1 && route.totalDistance > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const L = await import("leaflet");
        if (!cancelled) setLeafletMod(L);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!LeafletMod || !containerRef.current) return;
    const L = LeafletMod;
    const node = containerRef.current;
    node.innerHTML = "";

    try {
      const map = L.map(node, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([route.origin.lat, route.origin.lng], 15);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "OpenStreetMap contributors | CARTO",
        maxZoom: 19,
      }).addTo(map);

      const latlngs = route.path.map((p) => [p.lat, p.lng] as [number, number]);
      if (hasRoute) {
        L.polyline(latlngs, { color: "hsl(199, 95%, 58%)", weight: 5, opacity: 0.9, lineCap: "round" }).addTo(map);
        L.polyline(latlngs, { color: "hsl(271, 91%, 75%)", weight: 2, opacity: 0.8, dashArray: "6 8", lineCap: "round" }).addTo(map);
      }

      const originIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;border-radius:9999px;background:hsl(152,80%,50%);box-shadow:0 0 12px hsl(152,80%,50%);border:2px solid hsl(222,47%,6%)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="width:18px;height:18px;border-radius:9999px;background:hsl(0,84%,60%);box-shadow:0 0 14px hsl(0,84%,60%);border:2px solid hsl(222,47%,6%)"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      L.marker([route.origin.lat, route.origin.lng], { icon: originIcon }).addTo(map).bindTooltip("Origin", { permanent: hasRoute, direction: "top" });
      if (hasRoute) {
        L.marker([route.destination.lat, route.destination.lng], { icon: destIcon }).addTo(map).bindTooltip("Destination", { permanent: true, direction: "top" });
        map.fitBounds(latlngs, { padding: [48, 48], animate: true, duration: 0.5 });
      }

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch {
      setFailed(true);
    }
  }, [LeafletMod, hasRoute, route]);

  const recenter = () => {
    if (!mapRef.current) return;
    if (hasRoute && LeafletMod) {
      const bounds = LeafletMod.latLngBounds(route.path.map((p) => [p.lat, p.lng] as [number, number]));
      mapRef.current.fitBounds(bounds, { padding: [48, 48], animate: true, duration: 0.4 });
    } else {
      mapRef.current.setView([route.origin.lat, route.origin.lng], 15, { animate: true });
    }
  };

  return (
    <section id="section-navigation" className="glass-card relative overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b border-border/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Navigation2 className="h-4 w-4 text-primary text-glow-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Navigation Workspace</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:flex">
          <RouteMetric icon={RouteIcon} label="Distance" value={formatDistance(route.totalDistance)} />
          <RouteMetric icon={TimerReset} label="ETA" value={formatDuration(route.durationSeconds)} />
        </div>
      </div>

      <div className="relative h-[360px] w-full sm:h-[420px]">
        {!failed && <div ref={containerRef} className="absolute inset-0 transition-opacity duration-300" />}
        {failed && <FallbackMap route={route} />}

        {!hasRoute && !isLoading && !error && (
          <div className="absolute inset-0 z-[410] grid place-items-center bg-background/45 px-6 text-center backdrop-blur-[2px]">
            <div>
              <MapPin className="mx-auto mb-3 h-8 w-8 text-primary" />
              <div className="text-sm font-semibold text-foreground">Search for a destination</div>
              <div className="mt-1 text-xs text-muted-foreground">A live route, distance, ETA, and command list will appear here.</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-[420] grid place-items-center bg-background/55 px-6 text-center backdrop-blur-sm">
            <div className="rounded-2xl border border-primary/30 bg-card/90 px-5 py-4 shadow-[0_0_28px_hsl(var(--primary)/0.25)]">
              <Loader2 className="mx-auto mb-3 h-7 w-7 animate-spin text-primary" />
              <div className="text-sm font-semibold text-foreground">Calculating live route</div>
              <div className="mt-1 text-xs text-muted-foreground">Checking location, coordinates, and walking route.</div>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-x-4 bottom-4 z-[430] rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive backdrop-blur">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="absolute right-4 top-4 z-[440] flex flex-col gap-2">
          <MapButton label="Recenter route" onClick={recenter} icon={Crosshair} />
          <MapButton label="Zoom in" onClick={() => mapRef.current?.zoomIn()} icon={Plus} />
          <MapButton label="Zoom out" onClick={() => mapRef.current?.zoomOut()} icon={Minus} />
        </div>

        <div className="pointer-events-none absolute left-4 top-4 z-[400] max-w-[calc(100%-5.5rem)] rounded-xl border border-border/60 bg-card/85 px-3 py-2 backdrop-blur-md">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Destination</div>
          <div className="mt-1 truncate text-xs font-medium text-foreground">{route.destinationLabel}</div>
        </div>
      </div>
    </section>
  );
}

function RouteMetric({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MapButton({ label, icon: Icon, onClick }: { label: string; icon: ComponentType<{ className?: string }>; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-border/60 bg-card/90 text-muted-foreground backdrop-blur transition hover:border-primary/50 hover:text-primary"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function FallbackMap({ route }: { route: NavigationRoute }) {
  const { d, dots } = useMemo(() => {
    const lats = route.path.map((p) => p.lat);
    const lngs = route.path.map((p) => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const W = 800, H = 360, PAD = 40;
    const norm = (p: { lat: number; lng: number }) => ({
      x: PAD + ((p.lng - minLng) / (maxLng - minLng || 1)) * (W - PAD * 2),
      y: H - (PAD + ((p.lat - minLat) / (maxLat - minLat || 1)) * (H - PAD * 2)),
    });
    const pts = route.path.map(norm);
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return { d, dots: pts };
  }, [route]);

  if (route.path.length < 2) {
    return (
      <div className="grid h-full place-items-center bg-background/70 text-xs text-muted-foreground">
        Awaiting live route
      </div>
    );
  }

  return (
    <svg viewBox="0 0 800 360" className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(222,30%,18%)" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="route-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="hsl(152,80%,50%)" />
          <stop offset="100%" stopColor="hsl(0,84%,60%)" />
        </linearGradient>
      </defs>
      <rect width="800" height="360" fill="hsl(222,47%,6%)" />
      <rect width="800" height="360" fill="url(#grid)" />
      <path d={d} fill="none" stroke="url(#route-grad)" strokeWidth="4" strokeLinecap="round" />
      <path d={d} fill="none" stroke="hsl(199,95%,70%)" strokeWidth="2" strokeDasharray="6 10" className="animate-route-dash" />
      {dots[0] && <circle cx={dots[0].x} cy={dots[0].y} r="8" fill="hsl(152,80%,50%)" />}
      {dots[dots.length - 1] && <circle cx={dots[dots.length - 1].x} cy={dots[dots.length - 1].y} r="10" fill="hsl(0,84%,60%)" />}
    </svg>
  );
}
