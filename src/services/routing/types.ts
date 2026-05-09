import type { RouteStep } from "@/lib/commands";

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface LocationSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export type RouteStatus = "idle" | "locating" | "searching" | "routing" | "ready" | "error";

export interface NavigationRoute {
  origin: RoutePoint;
  destination: RoutePoint;
  path: RoutePoint[];
  steps: RouteStep[];
  totalDistance: number;
  etaMinutes: number;
  durationSeconds: number;
  destinationLabel: string;
  originLabel: string;
  calculatedAt?: string;
}
