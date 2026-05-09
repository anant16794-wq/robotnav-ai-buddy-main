import type { RobotCommand, RouteStep } from "@/lib/commands";
import type { LocationSuggestion, NavigationRoute, RoutePoint } from "./types";

export const DEFAULT_ORIGIN: RoutePoint = { lat: 51.5074, lng: -0.1278 };

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/foot";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: Array<{
      distance: number;
      maneuver: {
        type: string;
        modifier?: string;
      };
      name?: string;
    }>;
  }>;
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
}

export function makeEmptyRoute(origin: RoutePoint = DEFAULT_ORIGIN): NavigationRoute {
  return {
    origin,
    destination: origin,
    path: [origin],
    steps: [],
    totalDistance: 0,
    etaMinutes: 0,
    durationSeconds: 0,
    destinationLabel: "No destination selected",
    originLabel: "Current Location",
  };
}

export async function searchLocations(query: string, limit = 5): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    limit: String(limit),
    addressdetails: "1",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Location search failed. Please try again.");
  }

  const results = (await response.json()) as NominatimResult[];
  return results.map((item) => ({
    id: String(item.place_id),
    label: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

export async function buildRouteToDestination(
  destinationText: string,
  origin: RoutePoint = DEFAULT_ORIGIN,
  selectedLocation?: LocationSuggestion,
): Promise<NavigationRoute> {
  const destination = selectedLocation ?? (await geocodeDestination(destinationText));
  const route = await fetchOsrmRoute(origin, { lat: destination.lat, lng: destination.lng });

  return {
    origin,
    destination: { lat: destination.lat, lng: destination.lng },
    path: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    steps: makeRouteSteps(route),
    totalDistance: Math.round(route.distance),
    etaMinutes: Math.max(1, Math.round(route.duration / 60)),
    durationSeconds: Math.round(route.duration),
    destinationLabel: destination.label,
    originLabel: "Current Location",
    calculatedAt: new Date().toISOString(),
  };
}

export function resolveCurrentOrigin(fallback: RoutePoint): Promise<{ origin: RoutePoint; usedBrowserLocation: boolean }> {
  if (!("geolocation" in navigator)) return Promise.resolve({ origin: fallback, usedBrowserLocation: false });

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          origin: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          usedBrowserLocation: true,
        });
      },
      () => resolve({ origin: fallback, usedBrowserLocation: false }),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 6_000 },
    );
  });
}

async function geocodeDestination(destinationText: string): Promise<LocationSuggestion> {
  const suggestions = await searchLocations(destinationText, 1);
  if (!suggestions.length) {
    throw new Error("No matching location found. Try a more specific destination.");
  }
  return suggestions[0];
}

async function fetchOsrmRoute(origin: RoutePoint, destination: RoutePoint): Promise<OsrmRoute> {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
    alternatives: "false",
  });

  const response = await fetch(`${OSRM_URL}/${coords}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Routing service unavailable. Please try again in a moment.");
  }

  const data = (await response.json()) as OsrmResponse;
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(data.message || "No route found for that destination.");
  }

  return data.routes[0];
}

function makeRouteSteps(route: OsrmRoute): RouteStep[] {
  const rawSteps = route.legs.flatMap((leg) => leg.steps);
  const movementSteps = rawSteps
    .map((step, index) => ({
      id: index + 1,
      command: commandFromManeuver(step.maneuver.type, step.maneuver.modifier),
      label: labelFromManeuver(step.maneuver.type, step.maneuver.modifier, step.name),
      distance: Math.round(step.distance),
    }))
    .filter((step) => step.distance > 0 || step.command === "S");

  return [
    ...movementSteps.slice(0, 8),
    {
      id: movementSteps.length + 1,
      command: "S",
      label: "Arrive and Stop",
      distance: 0,
    },
  ];
}

function commandFromManeuver(type: string, modifier?: string): RobotCommand {
  if (type === "arrive") return "S";
  if (modifier?.includes("left")) return "L";
  if (modifier?.includes("right")) return "R";
  return "F";
}

function labelFromManeuver(type: string, modifier?: string, name?: string): string {
  if (type === "arrive") return "Arrive";
  if (modifier?.includes("left")) return name ? `Turn left onto ${name}` : "Turn left";
  if (modifier?.includes("right")) return name ? `Turn right onto ${name}` : "Turn right";
  if (name) return `Continue on ${name}`;
  return "Continue forward";
}
